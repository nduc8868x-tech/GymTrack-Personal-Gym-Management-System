import Groq from 'groq-sdk';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { selectExercises, estimateMinutes } from './exercise-selector';
import type {
  WeeklyPlanInput,
  WeeklyPlan,
  DayPlan,
  DayType,
  WorkoutType,
  Exercise,
  GroqPlanSchema,
  GroqDaySchema,
} from './types';

// ─── Groq client ──────────────────────────────────────────────────────────────

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
  if (!_groq) _groq = new Groq({ apiKey: env.GROQ_API_KEY });
  return _groq;
}

// ─── DB exercise fetch + mapping ──────────────────────────────────────────────

async function fetchExercisePool(): Promise<Exercise[]> {
  const rows = await prisma.exercise.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true, primary_muscle: true, equipment: true },
  });

  return rows.map((r) => ({
    id:          r.id,
    name:        r.name,
    muscleGroup: r.primary_muscle as Exercise['muscleGroup'],
    equipment:   r.equipment    as Exercise['equipment'],
    level:       'intermediate' as const, // DB does not store level; treated as intermediate
  }));
}

// ─── Fallback plan builder (no AI) ───────────────────────────────────────────

const SPLIT_TEMPLATES: Record<number, Array<{ name: string; type: DayType }>> = {
  3: [
    { name: 'Push Day',   type: 'push'  },
    { name: 'Rest',       type: 'rest'  },
    { name: 'Pull Day',   type: 'pull'  },
    { name: 'Rest',       type: 'rest'  },
    { name: 'Legs Day',   type: 'legs'  },
    { name: 'Rest',       type: 'rest'  },
    { name: 'Rest',       type: 'rest'  },
  ],
  4: [
    { name: 'Push Day',   type: 'push'  },
    { name: 'Pull Day',   type: 'pull'  },
    { name: 'Rest',       type: 'rest'  },
    { name: 'Legs Day',   type: 'legs'  },
    { name: 'Push Day',   type: 'push'  },
    { name: 'Rest',       type: 'rest'  },
    { name: 'Rest',       type: 'rest'  },
  ],
  5: [
    { name: 'Push Day',   type: 'push'    },
    { name: 'Pull Day',   type: 'pull'    },
    { name: 'Legs Day',   type: 'legs'    },
    { name: 'Rest',       type: 'rest'    },
    { name: 'Push Day',   type: 'push'    },
    { name: 'Full Body',  type: 'fullbody'},
    { name: 'Rest',       type: 'rest'    },
  ],
  6: [
    { name: 'Push Day',   type: 'push'  },
    { name: 'Pull Day',   type: 'pull'  },
    { name: 'Legs Day',   type: 'legs'  },
    { name: 'Push Day',   type: 'push'  },
    { name: 'Pull Day',   type: 'pull'  },
    { name: 'Legs Day',   type: 'legs'  },
    { name: 'Rest',       type: 'rest'  },
  ],
};

function fallbackStructure(daysPerWeek: number): GroqDaySchema[] {
  const clamped = Math.min(6, Math.max(3, daysPerWeek));
  const template = SPLIT_TEMPLATES[clamped] ?? SPLIT_TEMPLATES[4];
  return template.map((t, i) => ({ dayIndex: i, ...t }));
}

// ─── Groq plan structure ──────────────────────────────────────────────────────

async function getWeekStructure(input: WeeklyPlanInput): Promise<GroqDaySchema[]> {
  const prompt = `You are a professional strength & conditioning coach.
Generate a 7-day workout split as JSON.

Rules:
- daysPerWeek: ${input.daysPerWeek} (rest days = 7 - daysPerWeek)
- goal: ${input.goal}
- level: ${input.level}
- type values: "push" | "pull" | "legs" | "cardio" | "fullbody" | "rest"
- day names: "Push Day", "Pull Day", "Legs Day", "Cardio", "Full Body", "Rest"
- Beginner/fat_loss → prefer fullbody + cardio
- Advanced/muscle_gain → prefer push/pull/legs split
- Always return exactly 7 days (dayIndex 0–6)

Return ONLY this JSON, no prose:
{"days":[{"dayIndex":0,"name":"...","type":"..."},…]}`;

  try {
    const chat = await getGroq().chat.completions.create({
      model:       env.GROQ_MODEL,
      temperature: 0.3,
      max_tokens:  400,
      messages:    [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const raw   = chat.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<GroqPlanSchema>;

    if (!Array.isArray(parsed.days) || parsed.days.length !== 7) {
      throw new Error('Unexpected Groq response shape');
    }

    return parsed.days;
  } catch {
    return fallbackStructure(input.daysPerWeek);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateWeeklyPlan(input: WeeklyPlanInput): Promise<WeeklyPlan> {
  const [structure, exercisePool] = await Promise.all([
    getWeekStructure(input),
    fetchExercisePool(),
  ]);

  const days: DayPlan[] = structure.map((s) => {
    if (s.type === 'rest') {
      return {
        dayIndex:         s.dayIndex,
        name:             s.name,
        type:             'rest',
        exercises:        [],
        estimatedMinutes: 0,
      };
    }

    const exercises = selectExercises(
      s.type as WorkoutType,
      input.level,
      input.equipment,
      exercisePool,
      input.goal,
    );

    return {
      dayIndex:         s.dayIndex,
      name:             s.name,
      type:             s.type,
      exercises,
      estimatedMinutes: estimateMinutes(exercises),
    };
  });

  return {
    days,
    generatedAt: new Date().toISOString(),
  };
}
