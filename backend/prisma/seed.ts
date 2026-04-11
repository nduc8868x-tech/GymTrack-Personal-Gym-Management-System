import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  // CHEST
  { name: 'Bench Press (Barbell)', primary_muscle: 'chest', equipment: 'barbell', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'shoulders', is_primary: false }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Incline Bench Press (Barbell)', primary_muscle: 'chest', equipment: 'barbell', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'shoulders', is_primary: false }] },
  { name: 'Decline Bench Press (Barbell)', primary_muscle: 'chest', equipment: 'barbell', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  { name: 'Bench Press (Dumbbell)', primary_muscle: 'chest', equipment: 'dumbbell', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Incline Bench Press (Dumbbell)', primary_muscle: 'chest', equipment: 'dumbbell', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'shoulders', is_primary: false }] },
  { name: 'Chest Flyes (Dumbbell)', primary_muscle: 'chest', equipment: 'dumbbell', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  { name: 'Cable Crossover', primary_muscle: 'chest', equipment: 'cable', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  { name: 'Push-Up', primary_muscle: 'chest', equipment: 'bodyweight', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'arms', is_primary: false }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Chest Press (Machine)', primary_muscle: 'chest', equipment: 'machine', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  { name: 'Pec Deck (Machine)', primary_muscle: 'chest', equipment: 'machine', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  // BACK
  { name: 'Deadlift', primary_muscle: 'back', equipment: 'barbell', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'legs', is_primary: false }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Barbell Row', primary_muscle: 'back', equipment: 'barbell', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Pull-Up', primary_muscle: 'back', equipment: 'bodyweight', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Chin-Up', primary_muscle: 'back', equipment: 'bodyweight', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: true }] },
  { name: 'Lat Pulldown', primary_muscle: 'back', equipment: 'cable', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Seated Cable Row', primary_muscle: 'back', equipment: 'cable', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Dumbbell Row', primary_muscle: 'back', equipment: 'dumbbell', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'T-Bar Row', primary_muscle: 'back', equipment: 'barbell', muscles: [{ muscle_group: 'back', is_primary: true }] },
  { name: 'Hyperextension', primary_muscle: 'back', equipment: 'machine', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Face Pull', primary_muscle: 'back', equipment: 'cable', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'shoulders', is_primary: false }] },
  // LEGS
  { name: 'Squat (Barbell)', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Front Squat', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Romanian Deadlift', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Leg Press', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Leg Extension', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Leg Curl', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Calf Raise (Standing)', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Calf Raise (Seated)', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Lunge', primary_muscle: 'legs', equipment: 'bodyweight', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Bulgarian Split Squat', primary_muscle: 'legs', equipment: 'dumbbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Goblet Squat', primary_muscle: 'legs', equipment: 'dumbbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Hip Thrust', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Sumo Deadlift', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  // SHOULDERS
  { name: 'Overhead Press (Barbell)', primary_muscle: 'shoulders', equipment: 'barbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }, { muscle_group: 'arms', is_primary: false }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Overhead Press (Dumbbell)', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Lateral Raise', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Front Raise', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Rear Delt Fly', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Arnold Press', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Cable Lateral Raise', primary_muscle: 'shoulders', equipment: 'cable', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Shoulder Press (Machine)', primary_muscle: 'shoulders', equipment: 'machine', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Upright Row', primary_muscle: 'shoulders', equipment: 'barbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Shrug', primary_muscle: 'shoulders', equipment: 'barbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  // ARMS
  { name: 'Barbell Curl', primary_muscle: 'arms', equipment: 'barbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Dumbbell Curl', primary_muscle: 'arms', equipment: 'dumbbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Hammer Curl', primary_muscle: 'arms', equipment: 'dumbbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Preacher Curl', primary_muscle: 'arms', equipment: 'machine', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Cable Curl', primary_muscle: 'arms', equipment: 'cable', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Concentration Curl', primary_muscle: 'arms', equipment: 'dumbbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Tricep Pushdown', primary_muscle: 'arms', equipment: 'cable', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Tricep Dips', primary_muscle: 'arms', equipment: 'bodyweight', muscles: [{ muscle_group: 'arms', is_primary: true }, { muscle_group: 'chest', is_primary: false }] },
  { name: 'Skull Crusher', primary_muscle: 'arms', equipment: 'barbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Overhead Tricep Extension', primary_muscle: 'arms', equipment: 'dumbbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Close-Grip Bench Press', primary_muscle: 'arms', equipment: 'barbell', muscles: [{ muscle_group: 'arms', is_primary: true }, { muscle_group: 'chest', is_primary: false }] },
  { name: 'Wrist Curl', primary_muscle: 'arms', equipment: 'barbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  // CORE
  { name: 'Plank', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Crunch', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Sit-Up', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Leg Raise', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Russian Twist', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Cable Crunch', primary_muscle: 'core', equipment: 'cable', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Ab Wheel Rollout', primary_muscle: 'core', equipment: 'other', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Mountain Climbers', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }, { muscle_group: 'cardio', is_primary: false }] },
  { name: 'Side Plank', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Hanging Leg Raise', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Bicycle Crunch', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  // CARDIO
  { name: 'Running (Treadmill)', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Cycling (Stationary)', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Rowing Machine', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Jump Rope', primary_muscle: 'cardio', equipment: 'other', muscles: [{ muscle_group: 'cardio', is_primary: true }] },
  { name: 'Elliptical', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }] },
  { name: 'Stair Climber', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Burpees', primary_muscle: 'cardio', equipment: 'bodyweight', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'full_body', is_primary: false }] },
  { name: 'Box Jump', primary_muscle: 'cardio', equipment: 'other', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  // FULL BODY
  { name: 'Clean and Press', primary_muscle: 'full_body', equipment: 'barbell', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
  { name: 'Turkish Get-Up', primary_muscle: 'full_body', equipment: 'dumbbell', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Kettlebell Swing', primary_muscle: 'full_body', equipment: 'other', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Thruster', primary_muscle: 'full_body', equipment: 'barbell', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
  { name: 'Man Maker', primary_muscle: 'full_body', equipment: 'dumbbell', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
  { name: 'Power Clean', primary_muscle: 'full_body', equipment: 'barbell', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Snatch', primary_muscle: 'full_body', equipment: 'barbell', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
  { name: 'Battle Ropes', primary_muscle: 'full_body', equipment: 'other', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'cardio', is_primary: false }] },
  { name: 'Bear Crawl', primary_muscle: 'full_body', equipment: 'bodyweight', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Sled Push', primary_muscle: 'full_body', equipment: 'other', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Farmer Walk', primary_muscle: 'full_body', equipment: 'dumbbell', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Tire Flip', primary_muscle: 'full_body', equipment: 'other', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
];

async function main() {
  console.log('🌱 Seeding exercise library...');

  // Skip if already seeded
  const count = await prisma.exercise.count({ where: { is_custom: false } });
  if (count > 0) {
    console.log(`ℹ️  ${count} system exercises already exist. Skipping.`);
    return;
  }

  for (const ex of exercises) {
    await prisma.exercise.create({
      data: {
        name: ex.name,
        primary_muscle: ex.primary_muscle as never,
        equipment: ex.equipment as never,
        is_custom: false,
        exercise_muscles: {
          create: ex.muscles.map((m) => ({
            muscle_group: m.muscle_group as never,
            is_primary: m.is_primary,
          })),
        },
      },
    });
  }

  console.log(`✅ Seeded ${exercises.length} exercises`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
