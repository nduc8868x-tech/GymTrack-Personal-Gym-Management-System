# GymTrack — AI Layer, Skills & Agents Architecture

> **Version**: 1.0
> **Date**: 2026-04-05
> **Status**: Draft

---

## Overview

GymTrack sử dụng **Gemini API (Google AI)** làm AI engine trung tâm. Thay vì gọi API theo kiểu "chat đơn giản", hệ thống được thiết kế theo mô hình **Agentic AI** — AI có khả năng gọi các **Skills (Tools)** để truy vấn dữ liệu thực tế, sau đó tổng hợp và trả lời người dùng.

```
User Message
     │
     ▼
┌─────────────────────────────────────────────────────┐
│               AI Orchestrator (BE)                  │
│  1. Build system prompt (user profile + goals)      │
│  2. Attach conversation history                     │
│  3. Send to Gemini API với function declarations    │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
      ┌────────────────┐
      │   Gemini API   │ ← reasoning + tool selection
      └────────┬───────┘
               │ functionCall (if needed)
               ▼
┌─────────────────────────────────────────────────────┐
│              Skills Execution Layer (BE)             │
│  - getWorkoutHistory    - getNutritionSummary        │
│  - getProgressMetrics   - getBodyMeasurements        │
│  - getSchedule          - getPersonalRecords         │
└──────────────┬──────────────────────────────────────┘
               │ functionResponse
               ▼
      ┌────────────────┐
      │   Gemini API   │ ← synthesize final answer
      └────────┬───────┘
               │ stream
               ▼
         User Response
```

---

## Agent Types

| Agent | Trigger | Mô tả |
|-------|---------|-------|
| **Chat Agent** | User gửi message bất kỳ | Context-aware conversation, gọi tools khi cần dữ liệu |
| **Insight Agent** | User yêu cầu phân tích tuần/tháng | Tự động thu thập toàn bộ data period, tạo báo cáo tổng hợp |
| **Onboarding Agent** | Sau khi user hoàn thành onboarding | Gợi ý nutrition targets và lịch tập ban đầu dựa trên mục tiêu |

---

## Skills (Tool Definitions)

Mỗi skill là một function được định nghĩa trong `functionDeclarations` gửi lên Gemini API. Gemini tự quyết định khi nào gọi skill nào.

```typescript
// backend/src/ai/skills/index.ts
import { FunctionDeclaration, SchemaType } from "@google/generative-ai"

export const SKILL_DEFINITIONS: FunctionDeclaration[] = [
  {
    name: "getWorkoutHistory",
    description: "Lấy lịch sử buổi tập của user trong khoảng thời gian chỉ định",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        from_date: { type: SchemaType.STRING, description: "ISO date, e.g. 2026-03-01" },
        to_date:   { type: SchemaType.STRING, description: "ISO date, e.g. 2026-03-31" },
        limit:     { type: SchemaType.NUMBER, description: "Max số buổi trả về, mặc định 10" }
      },
      required: ["from_date", "to_date"]
    }
  },
  {
    name: "getNutritionSummary",
    description: "Lấy tóm tắt dinh dưỡng (calo, protein, carb, fat) theo ngày hoặc khoảng thời gian",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        from_date: { type: SchemaType.STRING },
        to_date:   { type: SchemaType.STRING }
      },
      required: ["from_date", "to_date"]
    }
  },
  {
    name: "getProgressMetrics",
    description: "Lấy dữ liệu cân nặng, body fat và các chỉ số cơ thể theo thời gian",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        metric:    { type: SchemaType.STRING, description: "weight | body_fat | all" },
        from_date: { type: SchemaType.STRING },
        to_date:   { type: SchemaType.STRING }
      },
      required: ["metric"]
    }
  },
  {
    name: "getPersonalRecords",
    description: "Lấy personal records (PR) của user theo bài tập cụ thể hoặc toàn bộ",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        exercise_name: { type: SchemaType.STRING, description: "Tên bài tập, bỏ trống để lấy tất cả PR" }
      }
    }
  },
  {
    name: "getSchedule",
    description: "Lấy lịch tập sắp tới của user",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        days_ahead: { type: SchemaType.NUMBER, description: "Số ngày tới cần xem, mặc định 7" }
      }
    }
  },
  {
    name: "getBodyMeasurements",
    description: "Lấy số đo cơ thể mới nhất (vòng eo, ngực, tay, chân...)",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        latest_only: { type: SchemaType.BOOLEAN, description: "true = chỉ lấy bản ghi gần nhất" }
      }
    }
  }
]
```

---

## Orchestrator Flow (Chi tiết)

```typescript
// backend/src/ai/orchestrator.ts
import { GoogleGenerativeAI, FunctionCallingMode } from "@google/generative-ai"
import { SKILL_DEFINITIONS } from "./skills"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function runChatAgent(userId: string, conversationId: string, userMessage: string) {
  // 1. Build system prompt
  const user    = await prisma.users.findUnique({ where: { id: userId } })
  const goals   = await prisma.user_goals.findFirst({ where: { user_id: userId, is_active: true } })
  const systemPrompt = buildSystemPrompt(user, goals)   // inject user profile + goals

  // 2. Load conversation history (max 20 messages để giữ context window hợp lý)
  const history = await prisma.ai_messages.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: 'asc' },
    take: 20
  })

  // 3. Khởi tạo model với tool definitions
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    tools: [{ functionDeclarations: SKILL_DEFINITIONS }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } }
  })

  // 4. Gọi Gemini API vòng lặp (agentic loop)
  const chat = model.startChat({ history })
  let result = await chat.sendMessage(userMessage)

  while (true) {
    const candidate = result.response.candidates?.[0]
    const finishReason = candidate?.finishReason

    if (finishReason === 'STOP') {
      // AI đã trả lời xong — stream về FE
      return result.response.text()
    }

    // Kiểm tra có functionCall parts không
    const functionCalls = candidate?.content.parts.filter(p => p.functionCall)
    if (functionCalls && functionCalls.length > 0) {
      // Thực thi tất cả function calls
      const functionResponses = await executeSkills(userId, functionCalls)
      // Gửi kết quả trả về Gemini để tổng hợp
      result = await chat.sendMessage(
        functionResponses.map(fr => ({ functionResponse: fr }))
      )
      // Tiếp tục vòng lặp → Gemini nhận kết quả và tổng hợp
    }
  }
}
```

---

## System Prompt Template

```
You are GymTrack AI Coach — a personal fitness assistant for {user.name}.

User Profile:
- Goal: {goal_type} | Target weight: {target_weight}kg by {target_date}
- Height: {height_cm}cm | Current weight: {latest_weight}kg
- Training frequency: {sessions_per_week} sessions/week

Guidelines:
- ONLY provide advice based on actual data retrieved via tools — never fabricate numbers
- When user asks about their progress, always call the relevant skill first
- Respond in the same language as the user (Vietnamese or English)
- Be concise and actionable — focus on what the user can do next
- If data is insufficient (< 2 weeks), acknowledge the limitation and encourage consistency
```

---

## Insight Agent (Phân tích định kỳ)

Được kích hoạt khi user vào trang **AI Coach → Phân tích tuần/tháng**. Khác với Chat Agent (reactive), Insight Agent chủ động thu thập data trước:

```
Trigger: GET /api/ai/insights?period=week|month
    │
    ▼
Insight Agent:
  1. Tự động gọi getWorkoutHistory(period)
  2. Tự động gọi getNutritionSummary(period)
  3. Tự động gọi getProgressMetrics(all, period)
  4. Tự động gọi getPersonalRecords()
    │
    ▼
Claude API:
  Nhận toàn bộ data → tạo báo cáo gồm:
  - Tổng số buổi tập & volume
  - Nutrition adherence so với target
  - Thay đổi cân nặng/body composition
  - PR mới đạt được
  - Điểm cần cải thiện + gợi ý cụ thể tuần tới
```

---

## Constraints & Safety

| Ràng buộc | Giá trị |
|-----------|---------|
| Max tool calls / turn | 5 (tránh infinite loop) |
| Max conversation history | 20 messages (context window management) |
| Response timeout | 10 giây (hiện loading indicator nếu vượt) |
| Fallback khi Gemini API lỗi | Hiện thông báo "AI Coach tạm thời không khả dụng" — không crash |
| Data isolation | Skills chỉ truy vấn data của `userId` hiện tại — không thể cross-user |
| No hallucination policy | AI bị ràng buộc trong system prompt: chỉ tư vấn dựa trên data thực có |
