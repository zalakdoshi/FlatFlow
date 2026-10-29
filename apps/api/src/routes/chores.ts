import { Router } from 'express';
import {
  createChoreSchema,
  calculateChoreFairness,
  getNextChoreAssignee,
} from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const choresRouter = Router();

// GET /api/flats/:flatId/chores
choresRouter.get('/flats/:flatId/chores', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;

    const members = await repositories.flats.getFlatMembers(flatId);
    const flatChores = await repositories.chores.getChoresByFlat(flatId);
    const fairnessScores = calculateChoreFairness(members, flatChores);

    res.json({
      chores: flatChores,
      fairnessScores,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/chores
choresRouter.post('/flats/:flatId/chores', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createChoreSchema.parse(req.body);

    const newChore = await repositories.chores.createChore(flatId, currentUserId, body);
    res.status(201).json({ chore: newChore });
  } catch (err) {
    next(err);
  }
});

// POST /api/chores/:id/complete
choresRouter.post('/chores/:id/complete', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    const chore = await repositories.chores.getChoreById(id);
    if (!chore) {
      res.status(404).json({ error: 'Not Found', message: 'Chore not found' });
      return;
    }

    // Household isolation check
    const member = await repositories.flats.getFlatMember(chore.flatId, currentUserId);
    if (!member) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized for this flat' });
      return;
    }

    const updated = await repositories.chores.completeChore(id, currentUserId);
    res.json({ message: 'Chore completed', chore: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/chores/rotate - Automatically rotate chore to next fairest roommate
choresRouter.post('/flats/:flatId/chores/rotate', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const { choreId } = req.body;

    const chore = await repositories.chores.getChoreById(choreId);
    if (!chore || chore.flatId !== flatId) {
      res.status(404).json({ error: 'Not Found', message: 'Chore not found in this flat' });
      return;
    }

    const activeMembers = await repositories.flats.getFlatMembers(flatId);
    const activeChores = await repositories.chores.getChoresByFlat(flatId);

    // Exclude current assignee to ensure rotation
    const eligibleMembers = activeMembers.filter((m) => m.userId !== chore.assignedTo);
    const nextMember = getNextChoreAssignee(
      eligibleMembers.length > 0 ? eligibleMembers : activeMembers,
      activeChores
    );

    if (nextMember) {
      chore.assignedTo = nextMember.userId;
      chore.assignee = nextMember.profile;
    }

    res.json({ message: 'Chore rotated successfully', chore });
  } catch (err) {
    next(err);
  }
});

