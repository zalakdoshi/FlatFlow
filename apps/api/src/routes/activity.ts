import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const activityRouter = Router();

// GET /api/flats/:flatId/activity
activityRouter.get('/flats/:flatId/activity', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const limit = Number(req.query.limit) || 50;

    const logs = await repositories.activity.getLogsByFlat(flatId, limit);
    res.json({ activities: logs });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications
activityRouter.get('/notifications', authMiddleware, (_req, res) => {
  res.json({ notifications: [], unreadCount: 0 });
});

// PATCH /api/notifications/:id/read
activityRouter.patch('/notifications/:id/read', authMiddleware, (req, res) => {
  const { id } = req.params;
  res.json({ message: 'Marked notification as read', id });
});

