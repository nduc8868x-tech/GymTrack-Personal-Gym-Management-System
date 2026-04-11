import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';

// ─── Gemini client (lazy init) ────────────────────────────────────────────────

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  if (!_genAI) _genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return _genAI;
}

// ─── Context builder ──────────────────────────────────────────────────────────

async function buildUserContext(userId: string): Promise<string> {
  const [user, recentSessions, currentPR, activePlan, activNutrition, latestMeasurement] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, gender: true, height_cm: true, birthdate: true, user_goals: { where: { is_active: true }, take: 1 } },
      }),
      prisma.workoutSession.findMany({
        where: { user_id: userId, ended_at: { not: null } },
        orderBy: { started_at: 'desc' },
        take: 5,
        include: {
          session_sets: {
            include: { exercise: { select: { name: true, primary_muscle: true } } },
          },
        },
      }),
      prisma.personalRecord.findMany({
        where: { user_id: userId, is_current_best: true },
        orderBy: { one_rm_estimate: 'desc' },
        take: 5,
        include: { exercise: { select: { name: true } } },
      }),
      prisma.workoutPlan.findFirst({
        where: { user_id: userId, is_active: true, deleted_at: null },
        include: { plan_days: { include: { plan_exercises: { include: { exercise: { select: { name: true } } } } } } },
      }),
      prisma.nutritionPlan.findFirst({ where: { user_id: userId, is_active: true } }),
      prisma.bodyMeasurement.findFirst({ where: { user_id: userId }, orderBy: { measured_at: 'desc' } }),
    ]);

  const lines: string[] = ['=== USER PROFILE ==='];
  if (user) {
    lines.push(`Name: ${user.name}`);
    if (user.gender) lines.push(`Gender: ${user.gender}`);
    if (user.height_cm) lines.push(`Height: ${user.height_cm} cm`);
    if (user.birthdate) {
      const age = Math.floor((Date.now() - new Date(user.birthdate).getTime()) / (365.25 * 86400000));
      lines.push(`Age: ${age}`);
    }
    if (user.user_goals[0]) {
      const g = user.user_goals[0];
      lines.push(`Goal: ${g.goal_type}${g.target_weight ? `, target weight: ${g.target_weight} kg` : ''}`);
    }
  }

  if (latestMeasurement) {
    lines.push('\n=== LATEST BODY MEASUREMENT ===');
    if (latestMeasurement.weight_kg) lines.push(`Weight: ${latestMeasurement.weight_kg} kg`);
    if (latestMeasurement.body_fat_pct) lines.push(`Body fat: ${latestMeasurement.body_fat_pct}%`);
  }

  if (activePlan) {
    lines.push('\n=== ACTIVE WORKOUT PLAN ===');
    lines.push(`Plan: ${activePlan.name}`);
    activePlan.plan_days.forEach((d) => {
      const exNames = d.plan_exercises.map((e) => e.exercise.name).join(', ');
      lines.push(`  Day ${d.day_of_week} (${d.name ?? 'unnamed'}): ${exNames}`);
    });
  }

  if (recentSessions.length > 0) {
    lines.push('\n=== RECENT WORKOUTS (last 5) ===');
    recentSessions.forEach((s) => {
      const date = s.started_at.toISOString().split('T')[0];
      const totalVol = s.session_sets.reduce(
        (sum, set) => sum + (set.weight_kg ?? 0) * (set.reps ?? 0),
        0,
      );
      const exercises = [...new Set(s.session_sets.map((set) => set.exercise.name))].join(', ');
      lines.push(`  ${date}: ${s.name ?? 'Workout'} — ${exercises} — volume: ${Math.round(totalVol)} kg`);
    });
  }

  if (currentPR.length > 0) {
    lines.push('\n=== PERSONAL RECORDS (top 5 by 1RM) ===');
    currentPR.forEach((pr) => {
      lines.push(
        `  ${pr.exercise.name}: ${pr.weight_kg ?? '—'}kg × ${pr.reps ?? '—'} reps (est. 1RM: ${pr.one_rm_estimate ?? '—'} kg)`,
      );
    });
  }

  if (activNutrition) {
    lines.push('\n=== NUTRITION PLAN ===');
    lines.push(`Daily target: ${activNutrition.daily_calories} kcal`);
    lines.push(`Macros: P${activNutrition.protein_g}g / C${activNutrition.carbs_g}g / F${activNutrition.fat_g}g`);
  }

  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are GymTrack AI Coach — a knowledgeable, encouraging, and practical fitness assistant.
You have access to the user's fitness data provided below. Use it to give personalised advice.
Keep answers concise and actionable. Use bullet points when listing items.
Never prescribe medical treatments. If asked about injuries or health conditions, advise seeing a professional.
Respond in the same language the user writes in.`;

// ─── Conversations ────────────────────────────────────────────────────────────

export async function listConversations(userId: string) {
  return prisma.aiConversation.findMany({
    where: { user_id: userId },
    orderBy: { updated_at: 'desc' },
    select: {
      id: true,
      title: true,
      context_type: true,
      created_at: true,
      updated_at: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function createConversation(
  userId: string,
  data: { context_type?: string; title?: string },
) {
  const contextType = (data.context_type ?? 'general') as
    | 'general'
    | 'workout_analysis'
    | 'nutrition_advice'
    | 'progress_review';

  // Take a snapshot of user context at conversation creation time
  const contextSnapshot = await buildUserContext(userId);

  return prisma.aiConversation.create({
    data: {
      user_id: userId,
      context_type: contextType,
      title: data.title ?? null,
      context_snapshot: contextSnapshot,
    },
  });
}

export async function getConversationMessages(conversationId: string, userId: string) {
  const conv = await prisma.aiConversation.findFirst({
    where: { id: conversationId, user_id: userId },
    include: { messages: { orderBy: { created_at: 'asc' } } },
  });
  if (!conv) {
    const err = new Error('Conversation not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  return conv;
}

export async function deleteConversation(conversationId: string, userId: string) {
  const conv = await prisma.aiConversation.findFirst({ where: { id: conversationId, user_id: userId } });
  if (!conv) {
    const err = new Error('Conversation not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  await prisma.aiConversation.delete({ where: { id: conversationId } });
}

// ─── Streaming message ────────────────────────────────────────────────────────

export async function streamMessage(
  conversationId: string,
  userId: string,
  userContent: string,
  res: Response,
) {
  // Verify conversation belongs to user
  const conv = await prisma.aiConversation.findFirst({
    where: { id: conversationId, user_id: userId },
    include: { messages: { orderBy: { created_at: 'asc' }, take: 40 } },
  });
  if (!conv) {
    const err = new Error('Conversation not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  // Save user message
  await prisma.aiMessage.create({
    data: { conversation_id: conversationId, role: 'user', content: userContent },
  });

  // Build Gemini chat history (exclude latest user msg — we pass it as current turn)
  const history = conv.messages.map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.content }],
  }));

  // Build context snapshot string from JSONB (Prisma returns object, not string)
  const contextSnapshot = conv.context_snapshot
    ? (typeof conv.context_snapshot === 'string'
        ? conv.context_snapshot
        : (conv.context_snapshot as string))
    : '';

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullResponse = '';

  try {
    const genAI = getGenAI();

    // Use systemInstruction (correct Gemini SDK approach)
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: contextSnapshot
        ? `${SYSTEM_PROMPT}\n\n${contextSnapshot}`
        : SYSTEM_PROMPT,
    });

    const chat = model.startChat({ history });

    // 20-second timeout wrapper
    const streamPromise = chat.sendMessageStream(userContent);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 20000),
    );

    const result = await Promise.race([streamPromise, timeoutPromise]);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
  } catch (err) {
    const isTimeout = (err as Error).message === 'GEMINI_TIMEOUT';
    console.error('[AI streamMessage error]', {
      conversationId,
      userId,
      isTimeout,
      message: (err as Error).message,
    });
    const fallback = isTimeout
      ? "I'm taking too long to respond. Please try asking again in a moment."
      : "I'm having trouble responding right now. Please try again later.";

    fullResponse = fallback;
    res.write(`data: ${JSON.stringify({ text: fallback, error: true })}\n\n`);
  }

  // Save assistant message
  if (fullResponse) {
    await prisma.aiMessage.create({
      data: { conversation_id: conversationId, role: 'assistant', content: fullResponse },
    });

    // Auto-generate title from first message if not set
    if (!conv.title && conv.messages.length === 0) {
      const title = userContent.length > 60 ? userContent.slice(0, 57) + '…' : userContent;
      await prisma.aiConversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

export async function getInsights(userId: string, period: 'week' | 'month') {
  const days = period === 'week' ? 7 : 30;
  const from = new Date(Date.now() - days * 86400000);

  const [sessions, measurements] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { user_id: userId, ended_at: { not: null }, started_at: { gte: from } },
      include: { session_sets: { include: { exercise: { select: { name: true, primary_muscle: true } } } } },
    }),
    prisma.bodyMeasurement.findMany({
      where: { user_id: userId, measured_at: { gte: from } },
      orderBy: { measured_at: 'asc' },
    }),
  ]);

  if (sessions.length === 0) {
    return {
      period,
      summary: `No workouts logged in the past ${days} days. Start tracking to get personalised insights!`,
      metrics: {},
    };
  }

  // Build metrics
  const totalVolume = sessions.reduce(
    (sum, s) => sum + s.session_sets.reduce((sv, set) => sv + (set.weight_kg ?? 0) * (set.reps ?? 0), 0),
    0,
  );

  const muscleFreq: Record<string, number> = {};
  sessions.forEach((s) =>
    s.session_sets.forEach((set) => {
      const m = set.exercise.primary_muscle;
      muscleFreq[m] = (muscleFreq[m] ?? 0) + 1;
    }),
  );
  const topMuscle = Object.entries(muscleFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

  const weightChange =
    measurements.length >= 2
      ? (measurements[measurements.length - 1].weight_kg ?? 0) - (measurements[0].weight_kg ?? 0)
      : null;

  const metrics = {
    workouts_count: sessions.length,
    total_volume_kg: Math.round(totalVolume),
    avg_volume_per_session_kg: Math.round(totalVolume / sessions.length),
    most_trained_muscle: topMuscle ?? null,
    weight_change_kg: weightChange !== null ? Math.round(weightChange * 10) / 10 : null,
  };

  // Ask Gemini to summarise
  let summary = '';
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

    const prompt = `You are a fitness coach. Analyse the following ${period}ly workout data and provide a short (3-5 bullet points) encouraging summary with actionable tips.\n\nData:\n${JSON.stringify(metrics, null, 2)}\n\nKeep it concise and motivating.`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
    ]);

    summary = (result as Awaited<ReturnType<typeof model.generateContent>>).response.text();
  } catch (err) {
    console.error('[AI getInsights error]', (err as Error).message);
    summary = `In the past ${days} days you completed ${metrics.workouts_count} workout${metrics.workouts_count !== 1 ? 's' : ''} with a total volume of ${metrics.total_volume_kg} kg. Keep it up!`;
  }

  return { period, summary, metrics };
}
