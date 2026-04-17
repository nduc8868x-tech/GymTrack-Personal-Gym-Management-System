import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SetLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  isPersonalRecord?: boolean;
}

export interface PlannedExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string;
  sets: number;
  reps: number;
  weightKg: number | null;
}

export interface ActiveSession {
  id: string;
  name: string;
  startedAt: string;
  sets: SetLog[];
  scheduledId?: string;
  plannedExercises?: PlannedExercise[];
}

interface WorkoutState {
  activeSession: ActiveSession | null;
  startSession: (session: Omit<ActiveSession, 'sets'>) => void;
  addSet: (set: SetLog) => void;
  removeSet: (setId: string) => void;
  endSession: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      activeSession: null,

      startSession: (session) =>
        set({ activeSession: { ...session, sets: [] } }),

      addSet: (newSet) =>
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, sets: [...state.activeSession.sets, newSet] }
            : null,
        })),

      removeSet: (setId) =>
        set((state) => ({
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                sets: state.activeSession.sets.filter((s) => s.id !== setId),
              }
            : null,
        })),

      endSession: () => set({ activeSession: null }),
    }),
    {
      name: 'workout-active-session',
      partialize: (state) => ({ activeSession: state.activeSession }),
    },
  ),
);
