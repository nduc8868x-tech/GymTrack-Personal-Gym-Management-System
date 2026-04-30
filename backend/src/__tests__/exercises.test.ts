import request from 'supertest';
import app from '../app';
import { signAccessToken } from '../utils/jwt';

jest.mock('../services/exercises.service');
import * as exercisesService from '../services/exercises.service';

const validToken = signAccessToken({ userId: 'user-uuid-1', email: 'test@example.com' });
const authHeader = `Bearer ${validToken}`;

const mockExercises = [
  { id: 'ex-1', name: 'Bench Press', primary_muscle: 'chest', equipment: 'barbell', is_custom: false, image_url: null },
  { id: 'ex-2', name: 'Squat', primary_muscle: 'legs', equipment: 'barbell', is_custom: false, image_url: null },
];

// ─── GET /api/exercises ───────────────────────────────────────────────────────

describe('GET /api/exercises', () => {
  it('401 — không có token', async () => {
    const res = await request(app).get('/api/exercises');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
  });

  it('200 — trả về danh sách bài tập', async () => {
    (exercisesService.listExercises as jest.Mock).mockResolvedValue({ exercises: mockExercises, total: 2 });

    const res = await request(app)
      .get('/api/exercises')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe('Bench Press');
  });

  it('200 — trả về rỗng khi tìm kiếm không có kết quả', async () => {
    (exercisesService.listExercises as jest.Mock).mockResolvedValue({ exercises: [], total: 0 });

    const res = await request(app)
      .get('/api/exercises?search=khongcobaitap')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ─── POST /api/exercises ──────────────────────────────────────────────────────

describe('POST /api/exercises', () => {
  it('401 — không có token', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .send({ name: 'Custom Push', primary_muscle: 'chest', equipment: 'bodyweight' });

    expect(res.status).toBe(401);
  });

  it('422 — thiếu trường name', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', authHeader)
      .send({ primary_muscle: 'chest', equipment: 'barbell' }); // thiếu name

    expect(res.status).toBe(422);
  });

  it('422 — primary_muscle không hợp lệ', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', authHeader)
      .send({ name: 'Custom Push', primary_muscle: 'invalid_muscle', equipment: 'barbell' });

    expect(res.status).toBe(422);
  });

  it('201 — tạo bài tập tuỳ chỉnh thành công', async () => {
    const newEx = { id: 'ex-new', name: 'Custom Push', primary_muscle: 'chest', equipment: 'bodyweight', is_custom: true, image_url: null };
    (exercisesService.createCustomExercise as jest.Mock).mockResolvedValue(newEx);

    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', authHeader)
      .send({ name: 'Custom Push', primary_muscle: 'chest', equipment: 'bodyweight' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Custom Push');
    expect(res.body.data.is_custom).toBe(true);
  });
});
