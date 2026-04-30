import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/response';
import passport from './config/passport';
import authRouter from './routes/auth';
import exercisesRouter from './routes/exercises';
import workoutsRouter from './routes/workouts';
import plansRouter from './routes/plans';
import scheduleRouter from './routes/schedule';
import notificationsRouter from './routes/notifications';
import progressRouter from './routes/progress';
import nutritionRouter from './routes/nutrition';
import aiRouter from './routes/ai';
import { reminderHandler } from './jobs/reminders';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      // In development, allow any localhost port
      if (env.NODE_ENV === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      // In production, only allow the configured FRONTEND_URL
      if (origin === env.FRONTEND_URL) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/plans', plansRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/nutrition', nutritionRouter);
app.use('/api/ai', aiRouter);

// Internal endpoints (Render Cron Job compatible)
app.post('/internal/reminders/check', reminderHandler);

// Global error handler
app.use(errorHandler);

export default app;
