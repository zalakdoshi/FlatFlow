import { Router } from 'express';
import { createVisitorSchema } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const visitorsRouter = Router();

// GET /api/flats/:flatId/visitors
visitorsRouter.get('/flats/:flatId/visitors', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const visitors = await repositories.visitors.getVisitorsByFlat(flatId);
    res.json({ visitors });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/visitors
visitorsRouter.post('/flats/:flatId/visitors', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createVisitorSchema.parse(req.body);

    const newVisitor = await repositories.visitors.createVisitor(flatId, {
      ...body,
      hostId: currentUserId,
    });

    res.status(201).json({ visitor: newVisitor });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/visitors/:id/checkin
visitorsRouter.patch('/visitors/:id/checkin', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitor = await repositories.visitors.checkInVisitor(id);

    if (!visitor) {
      res.status(404).json({ error: 'Not Found', message: 'Visitor record not found' });
      return;
    }

    res.json({ message: 'Visitor checked in', visitor });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/visitors/:id/checkout
visitorsRouter.patch('/visitors/:id/checkout', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitor = await repositories.visitors.checkOutVisitor(id);

    if (!visitor) {
      res.status(404).json({ error: 'Not Found', message: 'Visitor record not found' });
      return;
    }

    res.json({ message: 'Visitor checked out', visitor });
  } catch (err) {
    next(err);
  }
});

