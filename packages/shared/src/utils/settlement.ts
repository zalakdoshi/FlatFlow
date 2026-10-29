import type { Expense, Settlement, MemberBalance, SuggestedSettlement, FlatMember } from '../types.js';

/**
 * Calculates net balances for all flat members from the list of expenses and recorded settlements.
 *
 * For an expense:
 * - The payer gets credited with the full amount (+expense.amountPaise).
 * - Each split participant gets debited with their share (-split.sharePaise).
 *
 * For a completed settlement:
 * - The payer pays money (+amountPaise towards settlement credit, reducing their debt).
 * - The receiver receives money (-amountPaise towards settlement balance).
 */
export function calculateMemberBalances(
  members: FlatMember[],
  expenses: Expense[],
  settlements: Settlement[]
): MemberBalance[] {
  const balanceMap = new Map<
    string,
    { paidPaise: number; owedPaise: number; netPaise: number; name: string; avatarUrl: string | null }
  >();

  // Initialize all members
  for (const m of members) {
    balanceMap.set(m.userId, {
      paidPaise: 0,
      owedPaise: 0,
      netPaise: 0,
      name: m.profile?.fullName ?? 'Unknown Member',
      avatarUrl: m.profile?.avatarUrl ?? null,
    });
  }

  // Factor in expenses
  for (const exp of expenses) {
    const payer = balanceMap.get(exp.payerId);
    if (payer) {
      payer.paidPaise += exp.amountPaise;
      payer.netPaise += exp.amountPaise;
    }

    for (const split of exp.splits) {
      const participant = balanceMap.get(split.userId);
      if (participant) {
        participant.owedPaise += split.sharePaise;
        participant.netPaise -= split.sharePaise;
      }
    }
  }

  // Factor in completed settlements
  for (const s of settlements) {
    if (s.status !== 'completed') continue;

    // Payer of settlement sent money to clear their debt
    const payer = balanceMap.get(s.payerId);
    if (payer) {
      payer.netPaise += s.amountPaise;
    }

    // Receiver of settlement received money
    const receiver = balanceMap.get(s.receiverId);
    if (receiver) {
      receiver.netPaise -= s.amountPaise;
    }
  }

  return Array.from(balanceMap.entries()).map(([userId, data]) => ({
    userId,
    userName: data.name,
    avatarUrl: data.avatarUrl,
    totalPaidPaise: data.paidPaise,
    totalOwedPaise: data.owedPaise,
    netBalancePaise: data.netPaise,
  }));
}

/**
 * Smart Settlement Optimizer:
 * Calculates the minimal set of peer-to-peer repayments to settle all outstanding net balances.
 * Uses the greedy min-cash-flow algorithm.
 */
export function optimizeSettlements(balances: MemberBalance[]): SuggestedSettlement[] {
  // Separate into debtors (net < 0) and creditors (net > 0)
  const debtors: Array<{ userId: string; name: string; amount: number }> = [];
  const creditors: Array<{ userId: string; name: string; amount: number }> = [];

  for (const b of balances) {
    if (b.netBalancePaise < 0) {
      debtors.push({ userId: b.userId, name: b.userName, amount: Math.abs(b.netBalancePaise) });
    } else if (b.netBalancePaise > 0) {
      creditors.push({ userId: b.userId, name: b.userName, amount: b.netBalancePaise });
    }
  }

  // Sort descending by amount to maximize single-transaction clearance
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const suggestions: SuggestedSettlement[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    if (!debtor || !creditor) break;

    const transfer = Math.min(debtor.amount, creditor.amount);

    if (transfer > 0) {
      suggestions.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amountPaise: transfer,
      });

      debtor.amount -= transfer;
      creditor.amount -= transfer;
    }

    if (debtor.amount === 0) dIdx++;
    if (creditor.amount === 0) cIdx++;
  }

  return suggestions;
}
