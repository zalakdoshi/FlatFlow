import { Router } from 'express';
import { isDatabaseConfigured } from '../db/index.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'FlatFlow API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      configured: isDatabaseConfigured(),
      target: 'PostgreSQL / Supabase',
    },
  });
});
