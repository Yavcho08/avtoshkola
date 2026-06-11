import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ApiResponse } from './types';

// ─── Import type augmentation so req.user is visible project-wide ─────────────
// Type augmentations are picked up automatically via tsconfig include.

const app: Application = express();

// ─── Security & Logging Middleware ────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
import authRouter from './routes/auth.routes';
import studentsRouter from './routes/students.routes';
import instructorsRouter from './routes/instructors.routes';
import lessonsRouter from './routes/lessons.routes';
import examsRouter from './routes/exams.routes';
import vehiclesRouter from './routes/vehicles.routes';
import paymentsRouter from './routes/payments.routes';
import expensesRouter from './routes/expenses.routes';
import dashboardRouter from './routes/dashboard.routes';
import categoriesRouter from './routes/categories.routes';
import jobsRouter from './routes/jobs.routes';
import pushRouter from './routes/push.routes';
import emailRouter from './routes/email.routes';
import chatRouter from './routes/chat.routes';
import aiRouter from './routes/ai.routes';
import examSimRouter from './routes/exam-sim.routes';

app.use('/api/auth',        authRouter);
app.use('/api/students',    studentsRouter);
app.use('/api/instructors', instructorsRouter);
app.use('/api/lessons',     lessonsRouter);
app.use('/api/exams',       examsRouter);
app.use('/api/vehicles',    vehiclesRouter);
app.use('/api/payments',    paymentsRouter);
app.use('/api/expenses',    expensesRouter);
app.use('/api/dashboard',   dashboardRouter);
app.use('/api/categories',  categoriesRouter);
app.use('/api/jobs',        jobsRouter);
app.use('/api/push',        pushRouter);
app.use('/api/emails',      emailRouter);
app.use('/api/chat',        chatRouter);
app.use('/api/ai',          aiRouter);
app.use('/api/exam-sim',    examSimRouter);

// ─── 404 Catch-all ────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  const body: ApiResponse<null> = { data: null, error: 'Route not found.' };
  res.status(404).json(body);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err.stack);
  const body: ApiResponse<null> = { data: null, error: 'Internal server error.' };
  res.status(500).json(body);
});

export default app;
