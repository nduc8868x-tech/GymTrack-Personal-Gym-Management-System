# GymTrack — User Specification
## Users, Screens & Navigation

> **Version**: 1.0
> **Date**: 2026-03-28
> **Status**: Approved

---

## User Specification

### Target User: Gym User (Individual)

The user self-registers and self-manages all of their own training and nutrition data.

**User Persona:**
> **Male, 24 years old**, office worker, trains at the gym 4 sessions/week after work. Goal: muscle gain and fat loss. Often forgets workout schedule, can't remember how much weight he lifted last week, and doesn't know if he's hitting his protein target.

**User Journey — Happy Path:**
```
Register → Onboarding (personal info + goals)
→ Create Workout Plan → Schedule workouts for the week
→ Receive reminder notification → Log workout session
→ View Progress Dashboard → Chat with AI Coach to adjust program
```

**Edge Cases to Handle:**

| Scenario | Handling |
|----------|----------|
| No plan created | Dashboard still usable, shows empty state with guidance |
| Missed 2 weeks of training | Progress chart is not broken; AI comments only on available real data |
| Tab closed mid-session while logging | On reopen, prompt "Would you like to continue your unfinished workout?" |
| Weak network during workout | Show connection lost notice; entered data is preserved; auto-retry when reconnected |
| Gemini API timeout | Show "AI Coach temporarily unavailable, please try again" — app does not crash |
| Open Food Facts API down | Show notice, allow manual nutrition entry |
| Progress photo upload fails | Show toast error; photo not lost — user can retry |
| JWT expired (15 min) | Silent refresh using refresh token; if refresh token also expired → redirect to Login |
| Using iOS Safari < 16.4 | Web Push not available → send reminder via email, show an informational banner |

---

## Screen List & Features

| # | Screen | Type | Primary Functions | Priority | Empty State |
|---|--------|------|-------------------|----------|-------------|
| 1 | **Landing** | Screen | App introduction, Register/Login CTAs | MVP | — |
| 2 | **Login** | Screen | Login form, Google OAuth | MVP | — |
| 3 | **Register** | Screen | Account registration form, Google OAuth | MVP | — |
| 4 | **Forgot Password** | Screen | Enter email to receive reset link | MVP | — |
| 5 | **Onboarding** | Screen (multi-step) | Profile setup: personal info, goals, sessions/week | MVP | — |
| 6 | **Dashboard (Home)** | Screen | Today's overview: schedule, calories, latest PR, AI tip | MVP | Guide to create plan & schedule |
| 7 | **Calendar / Schedule** | Screen | Weekly/monthly workout schedule, create/delete sessions | MVP | "No schedule yet — Create one" |
| 8 | **Workout Session** | Screen (fullscreen) | Live session logging: select exercise, enter sets/reps/kg, rest timer | MVP | — |
| 9 | **Workout History** | Screen | List of completed sessions | MVP | "No sessions yet — Start training" |
| 10 | **Workout Session Detail** | Screen | Details of a logged session (read-only) | MVP | — |
| 11 | **Workout Plans** | Screen | List of plans, activate a plan | MVP | "No plans — Create a training program" |
| 12 | **Plan Detail / Editor** | Screen | Edit plan: add days, exercises, target sets/reps | MVP | "No training days — Add a day" |
| 13 | **Exercise Library** | Screen | Search exercises, filter by muscle group, view instructions | MVP | Not found → "Add custom exercise" |
| 14 | **Exercise Detail** | Screen | Exercise details + usage history + PRs | MVP | Never trained → "No history yet" |
| 15 | **Progress Dashboard** | Screen | Weight, measurements, volume, strength charts | MVP | "No data — Log your first weight entry" |
| 16 | **Body Measurements** | Screen | Log weight, measurements, upload progress photo | MVP | Empty timeline → guide to log |
| 17 | **Nutrition Dashboard** | Screen | Daily macro dashboard, today's calories vs. goal | Should | "No meals logged today" |
| 18 | **Food Log** | Screen | Log meals: breakfast/lunch/dinner/snack | Should | Empty meal → "Add food" |
| 19 | **Food Search** | Bottom Sheet | Search food (Open Food Facts + custom) — opened from Food Log | Should | Not found → "Add custom food" |
| 20 | **Nutrition Plan** | Screen | Create/edit calorie & macro goals by phase | Should | "No nutrition plan — Create one" |
| 21 | **AI Coach Chat** | Screen | Chat with AI, view weekly/monthly analysis, receive suggestions | Should | Welcome message + suggested first questions |
| 22 | **Profile & Settings** | Screen | Personal info, goals, units (kg/lbs), notifications | MVP | — |
| — | **Error / Offline** | Screen | No connection, 404, session expired → redirect to Login | MVP | — |

**Total: 22 screens + 1 Bottom Sheet + 1 Error Screen** (15 MVP + 7 Should-have)

---

## Navigation Layout

- **Desktop (≥768px):** Fixed sidebar on the left, 5 main items
- **Mobile (<768px):** Bottom Navigation Bar, max 5 items

```
Bottom Nav (Mobile):  Dashboard | Schedule | + (Workout) | Nutrition | Progress
Sidebar (Desktop):    Dashboard | Schedule | Workout | Nutrition | Progress | AI Coach | Profile
```
> AI Coach & Profile on mobile are accessible via menu icon or Profile avatar.

---

## Navigation Flow

```
AUTH FLOW
─────────
Landing
  ├── [Login]           → Login → Dashboard
  ├── [Register]        → Register → Onboarding (multi-step) → Dashboard
  └── [Forgot Password] → Forgot Password → (check email) → Login
JWT expired (cannot refresh) → any screen → Login

DASHBOARD
─────────
Dashboard
  ├── [Today's schedule card]  → Workout Session (live)
  ├── [View calendar]          → Calendar / Schedule
  ├── [Progress card]          → Progress Dashboard
  ├── [AI tip / Coach]         → AI Coach Chat
  └── [Avatar]                 → Profile & Settings

WORKOUT FLOW
────────────
Calendar / Schedule
  ├── [Select scheduled session]       → Workout Detail Modal
  │     ├── [Mark complete]            → update is_completed flag
  │     ├── [+ Thêm bài tập]           → Exercise Picker → confirm sets/reps/weight → add to schedule
  │     ├── [Edit exercise entry]      → inline edit sets/reps/weight
  │     ├── [Delete exercise entry]    → remove from scheduled_exercises
  │     └── [Delete scheduled workout] → delete with cascade
  └── [+ Create schedule]              → Modal: select date, time, plan day → save

Workout Page (today)
  ├── [KẾ HOẠCH HÔM NAY — BẮT ĐẦU]  → start session linked to today's schedule
  │     └── → Workout Session (live) with plan reference panel
  └── [New Session (manual)]           → Workout Session (live) without plan panel

Workout Session (live)
  ├── [KẾ HOẠCH HÔM NAY panel]        → tap row → auto-fill exercise + weight + reps in log form
  ├── [+ Add exercise]                 → Exercise Library → [Select] → return to Session
  ├── [Tap exercise]                   → expand set logger (inline, no screen exit)
  └── [Complete]                       → Workout Session Detail (summary of just-completed session)

Workout History
  └── [Tap session]     → Workout Session Detail (read-only)

Workout Plans
  ├── [Tap plan]        → Plan Detail / Editor
  └── [+ Create plan]   → Plan Detail / Editor (create mode)

Plan Detail / Editor
  └── [+ Add exercise]  → Exercise Library → [Select] → return to Editor

Exercise Library
  └── [Tap exercise]    → Exercise Detail

Exercise Detail
  └── [Use in plan]     → Plan Detail / Editor

PROGRESS FLOW
─────────────
Progress Dashboard
  ├── [+ Log weight/measurements]  → Body Measurements
  └── [Tap chart]                  → Body Measurements (view timeline)

NUTRITION FLOW
──────────────
Nutrition Dashboard
  ├── [+ Add meal]         → Food Log
  └── [View/edit goals]    → Nutrition Plan

Food Log
  └── [Search food]        → Food Search (Bottom Sheet)
        └── [Select food]  → return to Food Log (auto-fill)

AI COACH
────────
AI Coach Chat
  ├── [+ New conversation]  → create new conversation (inline)
  └── [Tap old conversation] → view previous chat history

PROFILE
───────
Profile & Settings
  ├── [Edit info]         → inline edit or modal
  ├── [Change password]   → modal
  ├── [Notifications]     → inline toggle
  └── [Logout]            → Landing
```

---

*Document version: 1.0 — 2026-03-28*
*Status: Approved*
