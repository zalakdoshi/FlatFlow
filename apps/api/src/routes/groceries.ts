import { Router } from 'express';
import {
  createGroceryItemSchema,
  updateGroceryItemSchema,
} from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const groceriesRouter = Router();

// GET /api/flats/:flatId/grocery-items
groceriesRouter.get('/flats/:flatId/grocery-items', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.user!.id;

    const flatList = await repositories.groceries.getOrCreateDefaultList(flatId, userId);
    const items = await repositories.groceries.getGroceryItems(flatList.id);

    res.json({ list: flatList, items });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/grocery-items
groceriesRouter.post('/flats/:flatId/grocery-items', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createGroceryItemSchema.parse(req.body);

    const flatList = await repositories.groceries.getOrCreateDefaultList(flatId, currentUserId);
    const newItem = await repositories.groceries.addItem(flatList.id, currentUserId, body);

    res.status(201).json({ item: newItem });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/grocery-items/:id
groceriesRouter.patch('/grocery-items/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = updateGroceryItemSchema.parse(req.body);

    const updated = await repositories.groceries.updateItem(id, body);
    if (!updated) {
      res.status(404).json({ error: 'Not Found', message: 'Item not found' });
      return;
    }

    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/grocery-items/:id
groceriesRouter.delete('/grocery-items/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await repositories.groceries.deleteItem(id);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found', message: 'Item not found' });
      return;
    }
    res.json({ message: 'Item deleted', id });
  } catch (err) {
    next(err);
  }
});

