import { Router } from 'express';
import { updateProfileSchema } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { repositories } from '../repositories/index.js';

export const usersRouter = Router();

// GET /api/users/profile
usersRouter.get('/users/profile', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    let profile = await repositories.profiles.getProfileById(userId);

    if (!profile) {
      profile = await repositories.profiles.upsertProfile({
        id: userId,
        fullName: req.user!.fullName ?? 'Roommate',
      });
    }

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/profile
usersRouter.patch('/users/profile', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = updateProfileSchema.parse(req.body);

    const existing = await repositories.profiles.getProfileById(userId);
    const profile = await repositories.profiles.upsertProfile({
      id: userId,
      fullName: body.fullName ?? existing?.fullName ?? req.user!.fullName ?? 'Roommate',
      avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : existing?.avatarUrl,
      phone: body.phone !== undefined ? body.phone : existing?.phone,
    });

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

