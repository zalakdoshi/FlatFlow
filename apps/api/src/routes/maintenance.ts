import { Router } from 'express';
import {
  createMaintenanceRequestSchema,
  updateMaintenanceStatusSchema,
  createMaintenanceCommentSchema,
} from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const maintenanceRouter = Router();

// GET /api/flats/:flatId/maintenance
maintenanceRouter.get('/flats/:flatId/maintenance', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const requests = await repositories.maintenance.getRequestsByFlat(flatId);
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/maintenance
maintenanceRouter.post('/flats/:flatId/maintenance', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createMaintenanceRequestSchema.parse(req.body);

    const newRequest = await repositories.maintenance.createRequest(flatId, currentUserId, body);
    res.status(201).json({ request: newRequest });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/maintenance/:id
maintenanceRouter.patch('/maintenance/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const body = updateMaintenanceStatusSchema.parse(req.body);

    const updated = await repositories.maintenance.updateStatus(id, body.status as any);
    if (!updated) {
      res.status(404).json({ error: 'Not Found', message: 'Maintenance request not found' });
      return;
    }

    if (body.resolutionNote) {
      await repositories.maintenance.addComment(
        id,
        currentUserId,
        `[Status changed to ${body.status}]: ${body.resolutionNote}`
      );
    }

    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/maintenance/:id/comments
maintenanceRouter.post('/maintenance/:id/comments', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const body = createMaintenanceCommentSchema.parse(req.body);

    const comment = await repositories.maintenance.addComment(id, currentUserId, body.comment);
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

