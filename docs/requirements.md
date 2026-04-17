# GymTrack — Requirements
## Functional & Non-Functional Requirements

> **Version**: 1.1
> **Date**: 2026-04-17
> **Status**: Approved

---

## Functional Requirements

> **Priority levels:**
> - `Must-have` — Cannot ship without this (MVP core)
> - `Should-have` — Important but can be deferred to next sprint
> - `Could-have` — Nice-to-have, implement if time allows

---

### FR-01: Authentication & User Profile — `Must-have`
**Actor:** Gym User

**Description:** Users can create an account, log in, and manage their personal profile.

**Features:**
- Register with email/password or Google OAuth
- Login and logout
- Forgot password / reset via email
- Set up profile: name, age, gender, height, current weight, goals

**Acceptance Criteria:**
- ✅ User registers successfully → receives confirmation email → can log in
- ✅ 5 failed login attempts → account locked for 15 minutes
- ✅ Forgot password → receives reset link via email, link expires after 1 hour
- ✅ Profile is saved and displayed correctly after update

---

### FR-02: Onboarding — `Must-have`
**Actor:** Gym User (new registration)

**Description:** After first registration, the user is guided through a setup flow to personalize the app experience.

**Features:**
- Enter body information: height, current weight
- Choose goal: muscle gain / fat loss / strength / overall health
- Choose number of training sessions per week
- AI automatically suggests nutrition targets (calories, macros) based on the above

**Acceptance Criteria:**
- ✅ Onboarding only appears once after first registration
- ✅ Can be skipped and revisited later in Profile & Settings
- ✅ After completion → redirects to Dashboard with pre-filled data

---

### FR-03: Workout Schedule — `Must-have`
**Actor:** Gym User

**Description:** Users can schedule workouts and receive reminders.

**Features:**
- Create workout schedule by day (select date, time, session name)
- Assign plan day to schedule
- View calendar in weekly/monthly format
- Workout reminders via web push notification

**Acceptance Criteria:**
- ✅ Create schedule for any future date
- ✅ If an active workout plan exists → plan days are automatically suggested by day of week
- ✅ Notification sent at the scheduled time (±1 minute)
- ✅ Completed sessions displayed differently from upcoming ones (different color/icon)
- ✅ Empty state: No schedule → display "Create your first workout" button

---

### FR-04: Workout Tracking (Session Logging) — `Must-have`
**Actor:** Gym User

**Description:** Users can record detailed information for an actual workout session.

**Features:**
- Start a new session (with or without a plan)
- Select exercises from library, enter sets / reps / weight (kg)
- Countdown timer for rest between sets
- Notes for each session
- View full workout history

**Acceptance Criteria:**
- ✅ Can log ≥1 exercise with ≥1 set in a session
- ✅ Add/remove sets during the session
- ✅ Timer continues when screen is not active (background)
- ✅ End session → data saved to Workout History immediately
- ✅ If weight × reps exceeds current PR → Personal Record automatically updated
- ✅ Empty state: Empty history → display "Start your first workout"

---

### FR-05: Workout Plans — `Must-have`
**Actor:** Gym User

**Description:** Users can create and manage weekly training programs.

**Features:**
- Create plan with name, description, split type (PPL / Upper-Lower / Full-body / Custom)
- Add training days of the week, each with a list of exercises + target sets/reps
- Activate one plan at a time
- Duplicate a plan to create a new one from an existing plan

**Acceptance Criteria:**
- ✅ Create a plan with at least 1 training day and 1 exercise
- ✅ Only 1 plan can be active at a time; activating a new plan → old plan auto-deactivates
- ✅ Delete plan → soft delete (workout history is preserved)
- ✅ Empty state: No plans → show suggestion to create first plan

---

### FR-06: Exercise Library — `Must-have`
**Actor:** Gym User

**Description:** Users can look up exercises and add custom exercises.

**Features:**
- Library of 100+ default exercises (name, primary/secondary muscle groups, description, video)
- Search by name, filter by muscle group and equipment
- Add custom exercises

**Acceptance Criteria:**
- ✅ Real-time search (300ms debounce), no Enter key required
- ✅ Custom exercises displayed separately from the system library
- ✅ Cannot delete system exercises; only user-created custom exercises can be deleted
- ✅ Deleting a custom exercise currently used in a plan/session → blocked with a warning

---

### FR-07: Progress Tracking — `Must-have`
**Actor:** Gym User

**Description:** Users can track body composition and strength changes over time.

**Features:**
- Log weight, % body fat, body measurements (chest, waist, hips, arms, thighs)
- Upload progress photos
- Charts for weight, training volume, strength progress (1RM estimate)
- Personal Records automatically recorded from session sets

**Acceptance Criteria:**
- ✅ Log measurement each day, view history in a timeline
- ✅ Weight chart displays from registration date to today
- ✅ 1RM estimated using Epley formula: `weight × (1 + reps/30)`
- ✅ New PR achieved → display "New PR!" badge during active session
- ✅ Empty state: No data → guide user to log first measurement

---

### FR-08: Nutrition Management — `Should-have`
**Actor:** Gym User

**Description:** Users can track daily nutrition and manage meal plans.

**Features:**
- Create nutrition plan: calorie goal, macro split (P/C/F)
- Log meals: breakfast/lunch/dinner/snack, search foods, enter serving size (grams)
- Food database integrated with Open Food Facts API + custom foods
- Daily dashboard: calories consumed vs. goal, macro breakdown

**Acceptance Criteria:**
- ✅ Real-time food search from Open Food Facts API (with fallback if API fails)
- ✅ Macros calculated automatically based on entered quantity_g
- ✅ Daily dashboard resets to 0 each new day
- ✅ Can delete incorrectly logged food entries
- ✅ Empty state: No meals logged → display "Log your first meal"

---

### FR-09: AI Coach — `Should-have`
**Actor:** Gym User

**Description:** Users receive personalized analysis and advice from AI based on actual data.

**Features:**
- AI analyzes training progress & nutrition weekly/monthly
- Suggests program adjustments based on progress
- Nutrition advice tailored to goals
- Free-form chat with AI coach (context-aware of user history)

**Acceptance Criteria:**
- ✅ AI can access the user's workout history, measurements, and nutrition logs to provide specific feedback
- ✅ AI responds within 10 seconds (or shows a loading indicator)
- ✅ Chat history is saved and displayed when reopening the app
- ✅ AI must not fabricate data — advice is based only on available real data

---

### FR-10: Data Export — `Could-have`
**Actor:** Gym User

**Description:** Users can export all personal data.

**Features:**
- Export workout history to CSV/JSON
- Export nutrition logs to CSV

**Acceptance Criteria:**
- ✅ Export file contains all data within the user-selected date range
- ✅ Download completes within 30 seconds

---

## Non-Functional Requirements

| NFR | Measurement Criteria |
|-----|----------------------|
| **Performance** | First Contentful Paint (FCP) < 2s on a 4G connection; API response < 500ms (measured with Lighthouse & Postman) |
| **Responsive** | Works correctly from 375px (iPhone SE) to 1440px desktop; tested on Chrome 100+, Safari 15+, Firefox 100+ |
| **Security** | Password minimum 8 characters with at least 1 letter + 1 number; JWT access token expiry 15 minutes, refresh token 7 days (silent refresh); rate limit 100 req/min/IP; full input validation via Zod; HTTPS required on production; CORS restricted to FE domain only |
| **Data Integrity** | Soft delete for workout plans & exercises; history is not lost when user deletes a plan |
| **Backup** | Automatic daily database backup managed by Neon (production) hoặc Docker volume (local dev) |
| **Availability** | Uptime ≥ 99% (leveraging Vercel + Render free tier SLA) |
| **Browser Support** | Web Push Notifications **not supported on iOS Safari < 16.4** — fallback: send reminders via email |
| **API Fallback** | Open Food Facts API down → show notice, allow manual entry; Groq API timeout (>15s) → show error message, app does not crash |

### Validation Constraints

Applied via Zod schema on both FE and BE:

| Field | Constraint |
|-------|-----------|
| `password` | min 8 characters, ≥1 letter + ≥1 digit |
| `weight_kg` | 20 – 500 kg |
| `height_cm` | 100 – 250 cm |
| `reps` | 1 – 100 |
| `set_number` | 1 – 20 |
| `quantity_g` (food log) | 1 – 5000 g |
| `body_fat_pct` | 1 – 60% |
| `rest_seconds` | 10 – 600 seconds |

---

*Document version: 1.1 — 2026-04-17*
*Status: Approved*
