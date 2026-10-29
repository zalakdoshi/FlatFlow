import type { Request, Response, NextFunction } from 'express';
import { repositories } from '../repositories/index.js';

export async function requireFlatMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
  const flatId = req.params.flatId || req.body.flatId;
  const userId = req.user?.id;

  if (!flatId) {
    res.status(400).json({ error: 'Bad Request', message: 'flatId parameter is required' });
    return;
  }

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    return;
  }

  try {
    let member = await repositories.flats.getFlatMember(flatId, userId);

    // Auto-enroll authenticated user in dev mode if they accessed flat
    if (!member && process.env.NODE_ENV !== 'production') {
      const flat = await repositories.flats.getFlatById(flatId);
      if (flat) {
        member = await repositories.flats.addMember({
          flatId,
          userId,
          role: 'member',
        });
      }
    }

    if (!member) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not an active member of this flat',
      });
      return;
    }

    req.membership = {
      flatId: member.flatId,
      userId: member.userId,
      role: member.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}

