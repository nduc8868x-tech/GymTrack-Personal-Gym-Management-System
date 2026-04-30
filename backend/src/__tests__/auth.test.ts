import request from 'supertest';
import app from '../app';
import { signAccessToken } from '../utils/jwt';

// Mock toàn bộ auth service — test chỉ kiểm tra HTTP layer
jest.mock('../services/auth.service');
import * as authService from '../services/auth.service';

const mockUser = { id: 'user-uuid-1', email: 'test@example.com', name: 'Test User', avatar_url: null };
const mockTokens = { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('201 — đăng ký thành công trả về user + token', async () => {
    (authService.register as jest.Mock).mockResolvedValue({ user: mockUser, ...mockTokens });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.data.access_token).toBe('mock-access-token');
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('409 — email đã tồn tại', async () => {
    const err = Object.assign(new Error('Email exists'), { code: 'EMAIL_EXISTS' });
    (authService.register as jest.Mock).mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', name: 'Dup User' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('422 — thiếu trường bắt buộc', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' }); // thiếu password và name

    expect(res.status).toBe(422);
  });

  it('422 — password quá ngắn', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: '123', name: 'Test' });

    expect(res.status).toBe(422);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('200 — đăng nhập thành công', async () => {
    (authService.login as jest.Mock).mockResolvedValue({ user: mockUser, ...mockTokens });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.user.id).toBe('user-uuid-1');
  });

  it('401 — sai mật khẩu', async () => {
    const err = Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
    (authService.login as jest.Mock).mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('422 — email không đúng định dạng', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(422);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('200 — luôn thành công dù không có cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('401 — không có refresh token cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
  });

  it('401 — refresh token không hợp lệ', async () => {
    const err = Object.assign(new Error('Invalid token'), { code: 'INVALID_TOKEN' });
    (authService.refresh as jest.Mock).mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refresh_token=bad-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('200 — refresh thành công trả về access token mới', async () => {
    (authService.refresh as jest.Mock).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refresh_token=valid-refresh-token');

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBe('new-access-token');
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('401 — không có Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
  });

  it('401 — token không hợp lệ', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('200 — token hợp lệ trả về thông tin user', async () => {
    (authService.getMe as jest.Mock).mockResolvedValue(mockUser);

    const validToken = signAccessToken({ userId: mockUser.id, email: mockUser.email });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@example.com');
  });
});
