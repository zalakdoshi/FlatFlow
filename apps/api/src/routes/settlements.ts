import { Router } from 'express';
import { createSettlementSchema } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const settlementsRouter = Router();

// GET /api/flats/:flatId/settlements
settlementsRouter.get('/flats/:flatId/settlements', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;

    const history = await repositories.settlements.getSettlementsByFlat(flatId);
    const { balances, suggestedSettlements } = await repositories.settlements.calculateBalances(flatId);

    res.json({
      balances,
      suggestedSettlements,
      settlementHistory: history,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/settlements
settlementsRouter.post('/flats/:flatId/settlements', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createSettlementSchema.parse(req.body);

    const newSettlement = await repositories.settlements.createSettlement(flatId, currentUserId, body);
    res.status(201).json({ settlement: newSettlement });
  } catch (err) {
    next(err);
  }
});

