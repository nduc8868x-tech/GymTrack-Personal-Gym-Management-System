import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const nameMap: Record<string, string> = {
  // CHEST
  'Bench Press (Barbell)':         'Đẩy Ngực Tạ Đòn',
  'Incline Bench Press (Barbell)': 'Đẩy Ngực Nghiêng Tạ Đòn',
  'Decline Bench Press (Barbell)': 'Đẩy Ngực Xuống Tạ Đòn',
  'Bench Press (Dumbbell)':        'Đẩy Ngực Tạ Đơn',
  'Incline Bench Press (Dumbbell)':'Đẩy Ngực Nghiêng Tạ Đơn',
  'Chest Flyes (Dumbbell)':        'Dang Ngực Tạ Đơn',
  'Cable Crossover':               'Dang Ngực Cáp Chéo',
  'Push-Up':                       'Hít Đất',
  'Chest Press (Machine)':         'Đẩy Ngực Máy',
  'Pec Deck (Machine)':            'Kẹp Ngực Máy',
  // BACK
  'Deadlift':                      'Kéo Đất',
  'Barbell Row':                   'Kéo Tạ Đòn Cúi',
  'Pull-Up':                       'Kéo Xà Rộng',
  'Chin-Up':                       'Kéo Xà Hẹp',
  'Lat Pulldown':                  'Kéo Cáp Trên Xuống',
  'Seated Cable Row':              'Kéo Cáp Ngồi',
  'Dumbbell Row':                  'Kéo Tạ Đơn Cúi',
  'T-Bar Row':                     'Kéo Thanh T',
  'Hyperextension':                'Ưỡn Lưng',
  'Face Pull':                     'Kéo Cáp Mặt',
  // LEGS
  'Squat (Barbell)':               'Squat Tạ Đòn',
  'Front Squat':                   'Squat Trước Ngực',
  'Romanian Deadlift':             'Kéo Đất Romania',
  'Leg Press':                     'Đẩy Chân Máy',
  'Leg Extension':                 'Duỗi Chân Máy',
  'Leg Curl':                      'Gập Chân Máy',
  'Calf Raise (Standing)':         'Nhón Gót Đứng',
  'Calf Raise (Seated)':           'Nhón Gót Ngồi',
  'Lunge':                         'Bước Tấn',
  'Bulgarian Split Squat':         'Squat Bulgaria',
  'Goblet Squat':                  'Squat Tạ Trước Ngực',
  'Hip Thrust':                    'Đẩy Hông',
  'Sumo Deadlift':                 'Kéo Đất Sumo',
  // SHOULDERS
  'Overhead Press (Barbell)':      'Đẩy Vai Tạ Đòn',
  'Overhead Press (Dumbbell)':     'Đẩy Vai Tạ Đơn',
  'Lateral Raise':                 'Nâng Ngang Vai',
  'Front Raise':                   'Nâng Trước Vai',
  'Rear Delt Fly':                 'Dang Vai Sau',
  'Arnold Press':                  'Arnold Press',
  'Cable Lateral Raise':           'Nâng Ngang Vai Cáp',
  'Shoulder Press (Machine)':      'Đẩy Vai Máy',
  'Upright Row':                   'Kéo Thẳng Đứng',
  'Shrug':                         'Nhún Vai',
  // ARMS
  'Barbell Curl':                  'Curl Tạ Đòn',
  'Dumbbell Curl':                 'Curl Tạ Đơn',
  'Hammer Curl':                   'Curl Búa',
  'Preacher Curl':                 'Curl Ghế Nghiêng',
  'Cable Curl':                    'Curl Cáp',
  'Concentration Curl':            'Curl Tập Trung',
  'Tricep Pushdown':               'Đẩy Xuống Cáp (Tay Sau)',
  'Tricep Dips':                   'Chống Tay Sau',
  'Skull Crusher':                 'Skull Crusher',
  'Overhead Tricep Extension':     'Duỗi Tay Sau Sau Đầu',
  'Close-Grip Bench Press':        'Đẩy Ngực Tay Hẹp',
  'Wrist Curl':                    'Curl Cổ Tay',
  // CORE
  'Plank':                         'Plank',
  'Crunch':                        'Gập Bụng',
  'Sit-Up':                        'Ngồi Dậy',
  'Leg Raise':                     'Nâng Chân',
  'Russian Twist':                 'Xoay Người',
  'Cable Crunch':                  'Gập Bụng Cáp',
  'Ab Wheel Rollout':              'Lăn Bánh Xe Bụng',
  'Mountain Climbers':             'Leo Núi',
  'Side Plank':                    'Plank Nghiêng',
  'Hanging Leg Raise':             'Nâng Chân Treo Xà',
  'Bicycle Crunch':                'Gập Bụng Đạp Xe',
  // CARDIO
  'Running (Treadmill)':           'Chạy Bộ (Máy)',
  'Cycling (Stationary)':          'Đạp Xe (Máy)',
  'Rowing Machine':                'Chèo Thuyền Máy',
  'Jump Rope':                     'Nhảy Dây',
  'Elliptical':                    'Máy Elliptical',
  'Stair Climber':                 'Leo Thang Máy',
  'Burpees':                       'Burpees',
  'Box Jump':                      'Nhảy Hộp',
  // FULL BODY
  'Clean and Press':               'Clean and Press',
  'Turkish Get-Up':                'Turkish Get-Up',
  'Kettlebell Swing':              'Swing Tạ Ấm',
  'Thruster':                      'Thruster',
  'Man Maker':                     'Man Maker',
  'Power Clean':                   'Power Clean',
  'Snatch':                        'Snatch',
  'Battle Ropes':                  'Dây Chiến Đấu',
  'Bear Crawl':                    'Bò Gấu',
  'Sled Push':                     'Đẩy Xe Trượt',
  'Farmer Walk':                   'Đi Bộ Tạ Nặng',
  'Tire Flip':                     'Lật Lốp',
};

async function main() {
  console.log('🔄 Renaming exercises to Vietnamese...');
  let updated = 0;
  let skipped = 0;

  for (const [oldName, newName] of Object.entries(nameMap)) {
    const ex = await prisma.exercise.findFirst({ where: { name: oldName } });
    if (!ex) { skipped++; continue; }
    await prisma.exercise.update({ where: { id: ex.id }, data: { name: newName } });
    updated++;
  }

  console.log(`✅ Updated: ${updated} | Skipped (not found): ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
