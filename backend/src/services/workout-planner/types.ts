// ─── Core domain types ────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'full_body';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'other';

export type WorkoutType = 'push' | 'pull' | 'legs' | 'cardio' | 'fullbody';
export type DayType = WorkoutType | 'rest';

export type Goal = 'muscle_gain' | 'fat_loss' | 'maintenance';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentContext = 'home' | 'gym';

export type WorkoutStatus = 'planned' | 'completed' | 'missed' | 'rest';
export type WorkoutSource = 'ai' | 'manual';
export type SessionStatus = 'in_progress' | 'completed';

export type CalendarMode = 'overwrite_all' | 'fill_empty_only' | 'from_today';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  level: Level;
}

export interface TemplateExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
  restSeconds: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: WorkoutType;
  exercises: TemplateExercise[];
  estimatedMinutes: number;
}

export interface ScheduledWorkout {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  exercises: TemplateExercise[];
  source: WorkoutSource;
  status: WorkoutStatus;
}

export interface WorkoutSession {
  id: string;
  scheduledWorkoutId: string;
  date: string; // YYYY-MM-DD
  status: SessionStatus;
  startedAt: string; // ISO
  completedAt?: string; // ISO
}

export interface WeeklyPlanInput {
  userId: string;
  goal: Goal;
  daysPerWeek: number;
  level: Level;
  equipment: EquipmentContext;
}

export interface DayPlan {
  dayIndex: number; // 0 = Monday … 6 = Sunday
  name: string;
  type: DayType;
  exercises: TemplateExercise[];
  estimatedMinutes: number;
}

export interface WeeklyPlan {
  days: DayPlan[]; // always 7 entries
  generatedAt: string; // ISO
}

// Groq JSON structure (internal)
export interface GroqDaySchema {
  dayIndex: number;
  name: string;
  type: DayType;
}

export interface GroqPlanSchema {
  days: GroqDaySchema[];
}
