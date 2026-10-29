import { Router } from 'express';
import { createExpenseSchema } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const expensesRouter = Router();

// GET /api/flats/:flatId/expenses
expensesRouter.get('/flats/:flatId/expenses', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const { category, payerId, search } = req.query;

    const populated = await repositories.expenses.getExpensesByFlat(flatId, {
      category: typeof category === 'string' ? category : undefined,
      payerId: typeof payerId === 'string' ? payerId : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    res.json({ expenses: populated, count: populated.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/expenses
expensesRouter.post('/flats/:flatId/expenses', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createExpenseSchema.parse(req.body);

    const newExpense = await repositories.expenses.createExpense(flatId, currentUserId, body);
    res.status(201).json({ expense: newExpense });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/expenses/:id
expensesRouter.delete('/expenses/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const exp = await repositories.expenses.getExpenseById(id);

    if (!exp) {
      res.status(404).json({ error: 'Not Found', message: 'Expense not found' });
      return;
    }

    // Verify membership for household isolation
    const member = await repositories.flats.getFlatMember(exp.flatId, currentUserId);
    if (!member) {
      res.status(403).json({ error: 'Forbidden', message: 'Not authorized to delete expenses for this household' });
      return;
    }

    await repositories.expenses.deleteExpense(id, exp.flatId, currentUserId);
    res.json({ message: 'Expense deleted successfully', id });
  } catch (err) {
    next(err);
  }
});

