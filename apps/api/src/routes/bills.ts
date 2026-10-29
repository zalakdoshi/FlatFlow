import { Router } from 'express';
import { createBillSchema, calculateEqualSplits } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const billsRouter = Router();

// GET /api/flats/:flatId/bills
billsRouter.get('/flats/:flatId/bills', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const flatBills = await repositories.bills.getBillsByFlat(flatId);
    res.json({ bills: flatBills });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/bills
billsRouter.post('/flats/:flatId/bills', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createBillSchema.parse(req.body);

    const splitShares = calculateEqualSplits(body.totalAmountPaise, body.participantUserIds);

    const newBill = await repositories.bills.createBill(flatId, currentUserId, {
      ...body,
      shares: splitShares,
    });

    res.status(201).json({ bill: newBill });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bills/:id/pay
billsRouter.patch('/bills/:id/pay', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    const bill = await repositories.bills.getBillById(id);
    if (!bill) {
      res.status(404).json({ error: 'Not Found', message: 'Bill not found' });
      return;
    }

    const share = bill.shares.find((s) => s.userId === currentUserId);
    if (!share) {
      res.status(400).json({ error: 'Not participant', message: 'User is not a participant in this bill' });
      return;
    }

    const remainingToPay = share.sharePaise - share.paidAmountPaise;
    const updatedShare = await repositories.bills.recordSharePayment(
      bill.flatId,
      bill.id,
      share.id,
      remainingToPay
    );

    const updatedBill = await repositories.bills.getBillById(id);
    res.json({ bill: updatedBill, updatedShare });
  } catch (err) {
    next(err);
  }
});

