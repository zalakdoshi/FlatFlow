import { Router } from 'express';
import { createAnnouncementSchema } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const announcementsRouter = Router();

// GET /api/flats/:flatId/announcements
announcementsRouter.get('/flats/:flatId/announcements', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;

    const announcements = await repositories.announcements.getAnnouncementsByFlat(flatId, currentUserId);
    res.json({ announcements });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/announcements
announcementsRouter.post('/flats/:flatId/announcements', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createAnnouncementSchema.parse(req.body);

    const newAnnouncement = await repositories.announcements.createAnnouncement(flatId, currentUserId, body);
    res.status(201).json({ announcement: newAnnouncement });
  } catch (err) {
    next(err);
  }
});

// POST /api/announcements/:id/read
announcementsRouter.post('/announcements/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    await repositories.announcements.markAsRead(id, currentUserId);
    res.json({ message: 'Marked as read', announcementId: id });
  } catch (err) {
    next(err);
  }
});

