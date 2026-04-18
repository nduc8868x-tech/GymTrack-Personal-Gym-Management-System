import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  // NGỰC
  { name: 'Đẩy Ngực Tạ Đòn', primary_muscle: 'chest', equipment: 'barbell', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'shoulders', is_primary: false }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Đẩy Ngực Nghiêng Tạ Đòn', primary_muscle: 'chest', equipment: 'barbell', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'shoulders', is_primary: false }] },
  { name: 'Đẩy Ngực Xuống Tạ Đòn', primary_muscle: 'chest', equipment: 'barbell', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  { name: 'Đẩy Ngực Tạ Đơn', primary_muscle: 'chest', equipment: 'dumbbell', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Đẩy Ngực Nghiêng Tạ Đơn', primary_muscle: 'chest', equipment: 'dumbbell', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'shoulders', is_primary: false }] },
  { name: 'Dang Ngực Tạ Đơn', primary_muscle: 'chest', equipment: 'dumbbell', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  { name: 'Dang Ngực Cáp Chéo', primary_muscle: 'chest', equipment: 'cable', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  { name: 'Hít Đất', primary_muscle: 'chest', equipment: 'bodyweight', muscles: [{ muscle_group: 'chest', is_primary: true }, { muscle_group: 'arms', is_primary: false }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Đẩy Ngực Máy', primary_muscle: 'chest', equipment: 'machine', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  { name: 'Kẹp Ngực Máy', primary_muscle: 'chest', equipment: 'machine', muscles: [{ muscle_group: 'chest', is_primary: true }] },
  // LƯNG
  { name: 'Kéo Đất', primary_muscle: 'back', equipment: 'barbell', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'legs', is_primary: false }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Kéo Tạ Đòn Cúi', primary_muscle: 'back', equipment: 'barbell', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Kéo Xà Rộng', primary_muscle: 'back', equipment: 'bodyweight', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Kéo Xà Hẹp', primary_muscle: 'back', equipment: 'bodyweight', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: true }] },
  { name: 'Kéo Cáp Trên Xuống', primary_muscle: 'back', equipment: 'cable', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Kéo Cáp Ngồi', primary_muscle: 'back', equipment: 'cable', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Kéo Tạ Đơn Cúi', primary_muscle: 'back', equipment: 'dumbbell', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Kéo Thanh T', primary_muscle: 'back', equipment: 'barbell', muscles: [{ muscle_group: 'back', is_primary: true }] },
  { name: 'Ưỡn Lưng', primary_muscle: 'back', equipment: 'machine', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Kéo Cáp Mặt', primary_muscle: 'back', equipment: 'cable', muscles: [{ muscle_group: 'back', is_primary: true }, { muscle_group: 'shoulders', is_primary: false }] },
  // CHÂN
  { name: 'Squat Tạ Đòn', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Squat Trước Ngực', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Kéo Đất Romania', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Đẩy Chân Máy', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Duỗi Chân Máy', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Gập Chân Máy', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Nhón Gót Đứng', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Nhón Gót Ngồi', primary_muscle: 'legs', equipment: 'machine', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Bước Tấn', primary_muscle: 'legs', equipment: 'bodyweight', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Squat Bulgaria', primary_muscle: 'legs', equipment: 'dumbbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Squat Tạ Trước Ngực', primary_muscle: 'legs', equipment: 'dumbbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Đẩy Hông', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }] },
  { name: 'Kéo Đất Sumo', primary_muscle: 'legs', equipment: 'barbell', muscles: [{ muscle_group: 'legs', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  // VAI
  { name: 'Đẩy Vai Tạ Đòn', primary_muscle: 'shoulders', equipment: 'barbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }, { muscle_group: 'arms', is_primary: false }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Đẩy Vai Tạ Đơn', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }, { muscle_group: 'arms', is_primary: false }] },
  { name: 'Nâng Ngang Vai', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Nâng Trước Vai', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Dang Vai Sau', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Arnold Press', primary_muscle: 'shoulders', equipment: 'dumbbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Nâng Ngang Vai Cáp', primary_muscle: 'shoulders', equipment: 'cable', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Đẩy Vai Máy', primary_muscle: 'shoulders', equipment: 'machine', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  { name: 'Kéo Thẳng Đứng', primary_muscle: 'shoulders', equipment: 'barbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Nhún Vai', primary_muscle: 'shoulders', equipment: 'barbell', muscles: [{ muscle_group: 'shoulders', is_primary: true }] },
  // TAY
  { name: 'Curl Tạ Đòn', primary_muscle: 'arms', equipment: 'barbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Curl Tạ Đơn', primary_muscle: 'arms', equipment: 'dumbbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Curl Búa', primary_muscle: 'arms', equipment: 'dumbbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Curl Ghế Nghiêng', primary_muscle: 'arms', equipment: 'machine', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Curl Cáp', primary_muscle: 'arms', equipment: 'cable', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Curl Tập Trung', primary_muscle: 'arms', equipment: 'dumbbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Đẩy Xuống Cáp (Tay Sau)', primary_muscle: 'arms', equipment: 'cable', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Chống Tay Sau', primary_muscle: 'arms', equipment: 'bodyweight', muscles: [{ muscle_group: 'arms', is_primary: true }, { muscle_group: 'chest', is_primary: false }] },
  { name: 'Skull Crusher', primary_muscle: 'arms', equipment: 'barbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Duỗi Tay Sau Sau Đầu', primary_muscle: 'arms', equipment: 'dumbbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  { name: 'Đẩy Ngực Tay Hẹp', primary_muscle: 'arms', equipment: 'barbell', muscles: [{ muscle_group: 'arms', is_primary: true }, { muscle_group: 'chest', is_primary: false }] },
  { name: 'Curl Cổ Tay', primary_muscle: 'arms', equipment: 'barbell', muscles: [{ muscle_group: 'arms', is_primary: true }] },
  // BỤNG
  { name: 'Plank', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Gập Bụng', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Ngồi Dậy', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Nâng Chân', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Xoay Người', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Gập Bụng Cáp', primary_muscle: 'core', equipment: 'cable', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Lăn Bánh Xe Bụng', primary_muscle: 'core', equipment: 'other', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Leo Núi', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }, { muscle_group: 'cardio', is_primary: false }] },
  { name: 'Plank Nghiêng', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Nâng Chân Treo Xà', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  { name: 'Gập Bụng Đạp Xe', primary_muscle: 'core', equipment: 'bodyweight', muscles: [{ muscle_group: 'core', is_primary: true }] },
  // CARDIO
  { name: 'Chạy Bộ (Máy)', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Đạp Xe (Máy)', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Chèo Thuyền Máy', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Nhảy Dây', primary_muscle: 'cardio', equipment: 'other', muscles: [{ muscle_group: 'cardio', is_primary: true }] },
  { name: 'Máy Elliptical', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }] },
  { name: 'Leo Thang Máy', primary_muscle: 'cardio', equipment: 'machine', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Burpees', primary_muscle: 'cardio', equipment: 'bodyweight', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'full_body', is_primary: false }] },
  { name: 'Nhảy Hộp', primary_muscle: 'cardio', equipment: 'other', muscles: [{ muscle_group: 'cardio', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  // TOÀN THÂN
  { name: 'Clean and Press', primary_muscle: 'full_body', equipment: 'barbell', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
  { name: 'Turkish Get-Up', primary_muscle: 'full_body', equipment: 'dumbbell', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Swing Tạ Ấm', primary_muscle: 'full_body', equipment: 'other', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Thruster', primary_muscle: 'full_body', equipment: 'barbell', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
  { name: 'Man Maker', primary_muscle: 'full_body', equipment: 'dumbbell', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
  { name: 'Power Clean', primary_muscle: 'full_body', equipment: 'barbell', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'back', is_primary: false }] },
  { name: 'Snatch', primary_muscle: 'full_body', equipment: 'barbell', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
  { name: 'Dây Chiến Đấu', primary_muscle: 'full_body', equipment: 'other', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'cardio', is_primary: false }] },
  { name: 'Bò Gấu', primary_muscle: 'full_body', equipment: 'bodyweight', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Đẩy Xe Trượt', primary_muscle: 'full_body', equipment: 'other', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'legs', is_primary: false }] },
  { name: 'Đi Bộ Tạ Nặng', primary_muscle: 'full_body', equipment: 'dumbbell', muscles: [{ muscle_group: 'full_body', is_primary: true }, { muscle_group: 'core', is_primary: false }] },
  { name: 'Lật Lốp', primary_muscle: 'full_body', equipment: 'other', muscles: [{ muscle_group: 'full_body', is_primary: true }] },
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
