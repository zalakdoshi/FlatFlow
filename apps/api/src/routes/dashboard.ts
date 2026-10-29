import { Router } from 'express';
import type { ExpenseCategory } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const dashboardRouter = Router();

dashboardRouter.get('/flats/:flatId/dashboard', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.user!.id;

    // Run all independent queries in parallel to eliminate sequential network latency waterfalls
    const [
      flat,
      members,
      expenses,
      settlementData,
      chores,
      bills,
      defaultList,
      visitors,
      maintenance,
      recentActivities,
    ] = await Promise.all([
      repositories.flats.getFlatById(flatId),
      repositories.flats.getFlatMembers(flatId),
      repositories.expenses.getExpensesByFlat(flatId),
      repositories.settlements.calculateBalances(flatId),
      repositories.chores.getChoresByFlat(flatId),
      repositories.bills.getBillsByFlat(flatId),
      repositories.groceries.getOrCreateDefaultList(flatId, userId),
      repositories.visitors.getVisitorsByFlat(flatId),
      repositories.maintenance.getRequestsByFlat(flatId),
      repositories.activity.getLogsByFlat(flatId, 10),
    ]);

    if (!flat) {
      res.status(404).json({ error: 'Not Found', message: 'Flat not found' });
      return;
    }

    // Grocery items for the default list
    const groceryItems = await repositories.groceries.getGroceryItems(defaultList.id);
    const groceryPendingCount = groceryItems.filter((item) => !item.isPurchased).length;

    // Monthly total spending
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthExpenses = expenses.filter((e) => e.expenseDate.startsWith(currentMonthPrefix));
    const monthlyTotalSpendingPaise = currentMonthExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

    // Category breakdown
    const categoryMap = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amountPaise);
    }
    const categorySpending = Array.from(categoryMap.entries()).map(([category, amountPaise]) => ({
      category,
      amountPaise,
    }));

    // Balances
    const { balances, suggestedSettlements } = settlementData;
    const userBalance = balances.find((b) => b.userId === userId);
    const userNetBalancePaise = userBalance ? userBalance.netBalancePaise : 0;

    // Counts
    const pendingChoresCount = chores.filter((c) => c.status !== 'completed').length;
    const upcomingBillsCount = bills.filter((b) => b.status !== 'paid').length;
    const activeVisitorsCount = visitors.filter((v) => v.checkedInAt && !v.checkedOutAt).length;
    const openMaintenanceCount = maintenance.filter(
      (m) => m.status !== 'resolved' && m.status !== 'cancelled'
    ).length;

    res.json({
      flat,
      monthlyTotalSpendingPaise,
      userNetBalancePaise,
      pendingChoresCount,
      upcomingBillsCount,
      groceryPendingCount,
      activeVisitorsCount,
      openMaintenanceCount,
      members,
      balances,
      suggestedSettlements,
      recentActivities,
      categorySpending,
    });
  } catch (err) {
    next(err);
  }
});
