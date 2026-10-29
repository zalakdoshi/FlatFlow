import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { flatsRouter } from './routes/flats.js';
import { dashboardRouter } from './routes/dashboard.js';
import { expensesRouter } from './routes/expenses.js';
import { settlementsRouter } from './routes/settlements.js';
import { billsRouter } from './routes/bills.js';
import { choresRouter } from './routes/chores.js';
import { groceriesRouter } from './routes/groceries.js';
import { maintenanceRouter } from './routes/maintenance.js';
import { visitorsRouter } from './routes/visitors.js';
import { announcementsRouter } from './routes/announcements.js';
import { eventsRouter } from './routes/events.js';
import { activityRouter } from './routes/activity.js';
import { usersRouter } from './routes/users.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = express();

  // CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-test-user-id'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api', flatsRouter);
  app.use('/api', dashboardRouter);
  app.use('/api', expensesRouter);
  app.use('/api', settlementsRouter);
  app.use('/api', billsRouter);
  app.use('/api', choresRouter);
  app.use('/api', groceriesRouter);
  app.use('/api', maintenanceRouter);
  app.use('/api', visitorsRouter);
  app.use('/api', announcementsRouter);
  app.use('/api', eventsRouter);
  app.use('/api', activityRouter);
  app.use('/api', usersRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.method} ${req.originalUrl} not found on FlatFlow API`,
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
