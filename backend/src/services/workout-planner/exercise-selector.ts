import type {
  Exercise,
  TemplateExercise,
  WorkoutType,
  Level,
  EquipmentContext,
  MuscleGroup,
  Goal,
} from './types';

// ─── Muscle group mappings ────────────────────────────────────────────────────

const MUSCLE_MAP: Record<WorkoutType, MuscleGroup[]> = {
  push:     ['chest', 'shoulders', 'arms'],
  pull:     ['back', 'arms'],
  legs:     ['legs', 'core'],
  fullbody: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
  cardio:   ['cardio'],
};

// ─── Equipment context ────────────────────────────────────────────────────────

const HOME_EQUIPMENT = new Set<string>(['bodyweight', 'dumbbell', 'other']);
const GYM_EQUIPMENT  = new Set<string>(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other']);

// ─── Level hierarchy ──────────────────────────────────────────────────────────

const LEVEL_RANK: Record<Level, number> = {
  beginner:     0,
  intermediate: 1,
  advanced:     2,
};

// ─── Per-goal, per-type volume presets ───────────────────────────────────────

interface VolumePreset {
  sets: number;
  reps: number;
  restSeconds: number;
}

const VOLUME: Record<Goal, Record<WorkoutType, VolumePreset>> = {
  muscle_gain: {
    push:     { sets: 4, reps: 8,  restSeconds: 120 },
    pull:     { sets: 4, reps: 8,  restSeconds: 120 },
    legs:     { sets: 4, reps: 10, restSeconds: 120 },
    fullbody: { sets: 3, reps: 10, restSeconds: 90  },
    cardio:   { sets: 1, reps: 1,  restSeconds: 30  },
  },
  fat_loss: {
    push:     { sets: 3, reps: 15, restSeconds: 60 },
    pull:     { sets: 3, reps: 15, restSeconds: 60 },
    legs:     { sets: 3, reps: 15, restSeconds: 60 },
    fullbody: { sets: 3, reps: 15, restSeconds: 60 },
    cardio:   { sets: 1, reps: 1,  restSeconds: 30 },
  },
  maintenance: {
    push:     { sets: 3, reps: 12, restSeconds: 90 },
    pull:     { sets: 3, reps: 12, restSeconds: 90 },
    legs:     { sets: 3, reps: 12, restSeconds: 90 },
    fullbody: { sets: 3, reps: 12, restSeconds: 90 },
    cardio:   { sets: 1, reps: 1,  restSeconds: 30 },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function estimateMinutes(exercises: TemplateExercise[]): number {
  if (exercises.length === 0) return 0;
  const workTime = exercises.reduce((acc, e) => {
    const repSeconds = e.reps <= 1 ? 20 * 60 : e.reps * 4; // cardio: 20min; strength: 4s/rep
    return acc + e.sets * (repSeconds + e.restSeconds);
  }, 0);
  return Math.round(workTime / 60) + 5; // +5 warm-up minutes
}

// ─── Main selector ────────────────────────────────────────────────────────────

export function selectExercises(
  type: WorkoutType,
  level: Level,
  equipment: EquipmentContext,
  exerciseDB: Exercise[],
  goal: Goal = 'muscle_gain',
): TemplateExercise[] {
  const targetMuscles = new Set(MUSCLE_MAP[type]);
  const allowedEquip  = equipment === 'home' ? HOME_EQUIPMENT : GYM_EQUIPMENT;
  const maxRank       = LEVEL_RANK[level];

  const filtered = exerciseDB.filter(
    (ex) =>
      targetMuscles.has(ex.muscleGroup) &&
      allowedEquip.has(ex.equipment) &&
      LEVEL_RANK[ex.level] <= maxRank,
  );

  // For fullbody: pick at most 2 per muscle group to ensure variety
  let pool: Exercise[];
  if (type === 'fullbody') {
    const byMuscle = new Map<MuscleGroup, Exercise[]>();
    for (const ex of shuffle(filtered)) {
      const bucket = byMuscle.get(ex.muscleGroup) ?? [];
      if (bucket.length < 2) bucket.push(ex);
      byMuscle.set(ex.muscleGroup, bucket);
    }
    pool = [...byMuscle.values()].flat();
  } else {
    pool = shuffle(filtered);
  }

  const count = type === 'cardio' ? 2 : Math.min(6, Math.max(4, pool.length));
  const selected = pool.slice(0, count);
  const preset   = VOLUME[goal][type];

  return selected.map((exercise) => ({
    exercise,
    sets:        preset.sets,
    reps:        type === 'cardio' ? 1 : preset.reps,
    restSeconds: preset.restSeconds,
  }));
}
