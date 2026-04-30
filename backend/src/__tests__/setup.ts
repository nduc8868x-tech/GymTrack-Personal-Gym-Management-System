// Set env vars before any module is imported
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-minimum-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum-32-chars!!';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '5001';
process.env.GROQ_API_KEY = '';
process.env.IMAGEKIT_PUBLIC_KEY = 'test';
process.env.IMAGEKIT_PRIVATE_KEY = 'test';
process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test';
