import { randomUUID } from 'crypto';
import type {
  Expense,
  ExpenseSplit,
  Settlement,
  Bill,
  BillShare,
  Chore,
  GroceryList,
  GroceryItem,
  MaintenanceRequest,
  MaintenanceComment,
  Visitor,
  Announcement,
  CalendarEvent,
  UserProfile,
  Flat,
  MemberRole,
  CreateExpenseInput,
  CreateBillInput,
  ActivityLog,
  ChorePriority,
  ChoreRecurrence,
  MaintenancePriority,
  EventType,
} from '@flatflow/shared';
import { inMemoryStore, type FlatCreationRequest as FlatRequest, SEED_IDS } from './store.js';
import type {
  IRepositories,
  IFlatRepository,
  IProfileRepository,
  IExpenseRepository,
  ISettlementRepository,
  IBillRepository,
  IChoreRepository,
  IGroceryRepository,
  IMaintenanceRepository,
  IVisitorRepository,
  IAnnouncementRepository,
  IEventRepository,
  IActivityRepository,
  FlatMemberWithProfile,
  UserFlatSummary,
  BalanceSummary,
  SuggestedSettlement,
} from './types.js';

export class MemoryFlatRepository implements IFlatRepository {
  async getUserFlats(userId: string): Promise<UserFlatSummary[]> {
    const memberships = Array.from(inMemoryStore.flatMembers.values()).filter(
      (m) => m.userId === userId && m.status === 'active'
    );
    return memberships
      .map((m) => {
        const flat = inMemoryStore.flats.get(m.flatId);
        if (!flat) return null;
        return {
          ...flat,
          role: m.role,
          joinedAt: m.joinedAt,
        };
      })
      .filter((f): f is UserFlatSummary => f !== null);
  }

  async getFlatById(flatId: string): Promise<Flat | null> {
    return inMemoryStore.flats.get(flatId) ?? null;
  }

  async createFlat(flatData: { name: string; addressLabel?: string | null; currency?: string; createdBy: string }): Promise<Flat> {
    const flatId = randomUUID();
    const newFlat: Flat = {
      id: flatId,
      name: flatData.name,
      addressLabel: flatData.addressLabel ?? null,
      currency: flatData.currency ?? 'INR',
      createdBy: flatData.createdBy,
      createdAt: new Date().toISOString(),
    };
    inMemoryStore.flats.set(flatId, newFlat);

    // Ensure creator has a profile
    let profile = inMemoryStore.profiles.get(flatData.createdBy);
    if (!profile) {
      profile = {
        id: flatData.createdBy,
        fullName: 'Flat Owner',
        avatarUrl: null,
        phone: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryStore.profiles.set(profile.id, profile);
    }

    // Add as owner member
    const memberId = randomUUID();
    inMemoryStore.flatMembers.set(memberId, {
      id: memberId,
      flatId,
      userId: flatData.createdBy,
      role: 'owner',
      status: 'active',
      joinedAt: new Date().toISOString(),
      profile,
    });

    // Create default grocery list
    const groceryListId = randomUUID();
    inMemoryStore.groceryLists.set(groceryListId, {
      id: groceryListId,
      flatId,
      name: 'Shared Kitchen Essentials',
      createdBy: flatData.createdBy,
      createdAt: new Date().toISOString(),
    });

    return newFlat;
  }

  async getFlatMembers(flatId: string): Promise<FlatMemberWithProfile[]> {
    return Array.from(inMemoryStore.flatMembers.values())
      .filter((m) => m.flatId === flatId && m.status === 'active')
      .map((m) => ({
        ...m,
        profile: inMemoryStore.profiles.get(m.userId) || m.profile || {
          id: m.userId,
          fullName: 'Roommate',
          avatarUrl: null,
          phone: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }));
  }

  async getFlatMember(flatId: string, userId: string): Promise<FlatMemberWithProfile | null> {
    const member = Array.from(inMemoryStore.flatMembers.values()).find(
      (m) => m.flatId === flatId && m.userId === userId && m.status === 'active'
    );
    if (!member) return null;
    return {
      ...member,
      profile: inMemoryStore.profiles.get(member.userId) || member.profile || {
        id: member.userId,
        fullName: 'Roommate',
        avatarUrl: null,
        phone: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async addMember(data: { flatId: string; userId: string; role: MemberRole; status?: 'active' | 'invited' }): Promise<FlatMemberWithProfile> {
    const memberId = randomUUID();
    let profile = inMemoryStore.profiles.get(data.userId);
    if (!profile) {
      profile = {
        id: data.userId,
        fullName: 'Roommate',
        avatarUrl: null,
        phone: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryStore.profiles.set(data.userId, profile);
    }

    const member: FlatMemberWithProfile = {
      id: memberId,
      flatId: data.flatId,
      userId: data.userId,
      role: data.role,
      status: data.status ?? 'active',
      joinedAt: new Date().toISOString(),
      profile,
    };
    inMemoryStore.flatMembers.set(memberId, member);
    return member;
  }

  async updateMemberRole(flatId: string, memberId: string, role: MemberRole): Promise<FlatMemberWithProfile | null> {
    const member = inMemoryStore.flatMembers.get(memberId);
    if (!member || member.flatId !== flatId) return null;
    member.role = role;
    inMemoryStore.flatMembers.set(memberId, member);
    return {
      ...member,
      profile: inMemoryStore.profiles.get(member.userId) || member.profile || {
        id: member.userId,
        fullName: 'Roommate',
        avatarUrl: null,
        phone: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async removeMember(flatId: string, memberId: string): Promise<boolean> {
    const member = inMemoryStore.flatMembers.get(memberId);
    if (!member || member.flatId !== flatId) return false;
    member.status = 'left';
    return true;
  }

  async getInviteByCode(code: string) {
    const invite = Array.from(inMemoryStore.flatInvites.values()).find(
      (i) => i.code.toUpperCase() === code.trim().toUpperCase()
    );
    return invite ?? null;
  }

  async createInvite(flatId: string, invitedBy: string) {
    const inviteId = randomUUID();
    const code = `DOME-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const invite = {
      id: inviteId,
      flatId,
      tokenHash: `hash-${code}`,
      code,
      invitedBy,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      maxUses: 10,
      useCount: 0,
      createdAt: new Date().toISOString(),
    };
    inMemoryStore.flatInvites.set(inviteId, invite);
    return { id: inviteId, flatId, code };
  }

  async useInvite(inviteId: string): Promise<void> {
    const invite = inMemoryStore.flatInvites.get(inviteId);
    if (invite) {
      invite.useCount += 1;
    }
  }

  async getPendingFlatRequests(): Promise<FlatRequest[]> {
    return Array.from(inMemoryStore.flatRequests.values()).filter((r) => r.status === 'pending');
  }

  async createFlatRequest(data: { name: string; addressLabel?: string; currency?: string; requestedBy: string; requesterName: string }): Promise<FlatRequest> {
    const id = `req-${randomUUID()}`;
    const req: FlatRequest = {
      id,
      name: data.name,
      addressLabel: data.addressLabel ?? '',
      currency: data.currency ?? 'INR',
      requestedBy: data.requestedBy,
      requesterName: data.requesterName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    inMemoryStore.flatRequests.set(id, req);
    return req;
  }

  async approveFlatRequest(requestId: string, adminId: string): Promise<{ request: FlatRequest; flat: Flat }> {
    const req = inMemoryStore.flatRequests.get(requestId);
    if (!req) throw new Error('Flat request not found');
    req.status = 'approved';
    req.approvedAt = new Date().toISOString();

    const flat = await this.createFlat({
      name: req.name,
      addressLabel: req.addressLabel,
      currency: req.currency,
      createdBy: req.requestedBy,
    });

    // Also add the approving admin as an admin member if not already
    const existing = await this.getFlatMember(flat.id, adminId);
    if (!existing) {
      await this.addMember({
        flatId: flat.id,
        userId: adminId,
        role: 'admin',
      });
    }

    return { request: req, flat };
  }

  async rejectFlatRequest(requestId: string, _adminId: string): Promise<FlatRequest> {
    const req = inMemoryStore.flatRequests.get(requestId);
    if (!req) throw new Error('Flat request not found');
    req.status = 'rejected';
    return req;
  }
}

export class MemoryProfileRepository implements IProfileRepository {
  async getProfileById(id: string): Promise<UserProfile | null> {
    return inMemoryStore.profiles.get(id) ?? null;
  }

  async upsertProfile(data: Partial<UserProfile> & { id: string; fullName: string }): Promise<UserProfile> {
    const existing = inMemoryStore.profiles.get(data.id);
    const updated: UserProfile = {
      id: data.id,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl ?? existing?.avatarUrl ?? null,
      phone: data.phone ?? existing?.phone ?? null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryStore.profiles.set(data.id, updated);
    return updated;
  }

  async getProfilesByIds(ids: string[]): Promise<Map<string, UserProfile>> {
    const map = new Map<string, UserProfile>();
    for (const id of ids) {
      const p = inMemoryStore.profiles.get(id);
      if (p) map.set(id, p);
    }
    return map;
  }
}

export class MemoryExpenseRepository implements IExpenseRepository {
  async getExpensesByFlat(
    flatId: string,
    filters?: { category?: string; payerId?: string; search?: string }
  ): Promise<Expense[]> {
    let list = Array.from(inMemoryStore.expenses.values()).filter((e) => e.flatId === flatId);

    if (filters?.category) list = list.filter((e) => e.category === filters.category);
    if (filters?.payerId) list = list.filter((e) => e.payerId === filters.payerId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }

    return list
      .map((e) => ({
        ...e,
        payer: inMemoryStore.profiles.get(e.payerId) || e.payer,
        splits: e.splits.map((s) => ({
          ...s,
          user: inMemoryStore.profiles.get(s.userId) || s.user,
        })),
      }))
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }

  async getExpenseById(expenseId: string): Promise<Expense | null> {
    const exp = inMemoryStore.expenses.get(expenseId);
    if (!exp) return null;
    return {
      ...exp,
      payer: inMemoryStore.profiles.get(exp.payerId) || exp.payer,
      splits: exp.splits.map((s) => ({
        ...s,
        user: inMemoryStore.profiles.get(s.userId) || s.user,
      })),
    };
  }

  async createExpense(flatId: string, creatorId: string, input: CreateExpenseInput): Promise<Expense> {
    const expenseId = randomUUID();
    const nowIso = new Date().toISOString();
    const payerProfile = inMemoryStore.profiles.get(input.payerId);

    const splits = input.splits.map((s) => {
      const splitId = randomUUID();
      const splitObj = {
        id: splitId,
        expenseId,
        userId: s.userId,
        sharePaise: s.sharePaise,
        user: inMemoryStore.profiles.get(s.userId),
      };
      inMemoryStore.expenseSplits.set(splitId, splitObj);
      return splitObj;
    });

    const newExpense: Expense = {
      id: expenseId,
      flatId,
      payerId: input.payerId,
      description: input.description,
      category: input.category,
      amountPaise: input.amountPaise,
      expenseDate: input.expenseDate,
      receiptPath: input.receiptPath ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
      payer: payerProfile,
      splits,
    };
    inMemoryStore.expenses.set(expenseId, newExpense);

    inMemoryStore.activityLogs.push({
      id: randomUUID(),
      flatId,
      actorId: creatorId,
      action: 'created_expense',
      entityType: 'expense',
      entityId: expenseId,
      previousValues: null,
      newValues: { description: input.description, amountPaise: input.amountPaise },
      createdAt: nowIso,
      actor: inMemoryStore.profiles.get(creatorId),
    });

    return newExpense;
  }

  async deleteExpense(expenseId: string, flatId: string, actorId: string): Promise<boolean> {
    const exp = inMemoryStore.expenses.get(expenseId);
    if (!exp || exp.flatId !== flatId) return false;

    for (const s of exp.splits) {
      inMemoryStore.expenseSplits.delete(s.id);
    }
    inMemoryStore.expenses.delete(expenseId);

    inMemoryStore.activityLogs.push({
      id: randomUUID(),
      flatId,
      actorId,
      action: 'deleted_expense',
      entityType: 'expense',
      entityId: expenseId,
      previousValues: { description: exp.description, amountPaise: exp.amountPaise },
      newValues: null,
      createdAt: new Date().toISOString(),
      actor: inMemoryStore.profiles.get(actorId),
    });

    return true;
  }
}

export class MemorySettlementRepository implements ISettlementRepository {
  async getSettlementsByFlat(flatId: string): Promise<Settlement[]> {
    return Array.from(inMemoryStore.settlements.values())
      .filter((s) => s.flatId === flatId)
      .map((s) => ({
        ...s,
        payer: inMemoryStore.profiles.get(s.payerId) || s.payer,
        receiver: inMemoryStore.profiles.get(s.receiverId) || s.receiver,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSettlement(
    flatId: string,
    actorId: string,
    data: { payerId: string; receiverId: string; amountPaise: number }
  ): Promise<Settlement> {
    const settlementId = randomUUID();
    const nowIso = new Date().toISOString();
    const settlement: Settlement = {
      id: settlementId,
      flatId,
      payerId: data.payerId,
      receiverId: data.receiverId,
      amountPaise: data.amountPaise,
      status: 'completed',
      settledAt: nowIso,
      createdAt: nowIso,
      payer: inMemoryStore.profiles.get(data.payerId),
      receiver: inMemoryStore.profiles.get(data.receiverId),
    };
    inMemoryStore.settlements.set(settlementId, settlement);

    inMemoryStore.activityLogs.push({
      id: randomUUID(),
      flatId,
      actorId,
      action: 'recorded_settlement',
      entityType: 'settlement',
      entityId: settlementId,
      previousValues: null,
      newValues: { amountPaise: data.amountPaise },
      createdAt: nowIso,
      actor: inMemoryStore.profiles.get(actorId),
    });

    return settlement;
  }

  async calculateBalances(flatId: string): Promise<{
    balances: BalanceSummary[];
    suggestedSettlements: SuggestedSettlement[];
  }> {
    const members = Array.from(inMemoryStore.flatMembers.values()).filter(
      (m) => m.flatId === flatId && m.status === 'active'
    );
    const expenses = Array.from(inMemoryStore.expenses.values()).filter((e) => e.flatId === flatId);
    const settlements = Array.from(inMemoryStore.settlements.values()).filter(
      (s) => s.flatId === flatId && s.status === 'completed'
    );

    const paidMap = new Map<string, number>();
    const owedMap = new Map<string, number>();

    for (const m of members) {
      paidMap.set(m.userId, 0);
      owedMap.set(m.userId, 0);
    }

    for (const e of expenses) {
      paidMap.set(e.payerId, (paidMap.get(e.payerId) || 0) + e.amountPaise);
      for (const s of e.splits) {
        owedMap.set(s.userId, (owedMap.get(s.userId) || 0) + s.sharePaise);
      }
    }

    for (const s of settlements) {
      paidMap.set(s.payerId, (paidMap.get(s.payerId) || 0) + s.amountPaise);
      owedMap.set(s.receiverId, (owedMap.get(s.receiverId) || 0) + s.amountPaise);
    }

    const balances: BalanceSummary[] = members.map((m) => {
      const paid = paidMap.get(m.userId) || 0;
      const owed = owedMap.get(m.userId) || 0;
      const prof = inMemoryStore.profiles.get(m.userId) || m.profile || {
        id: m.userId,
        fullName: 'Roommate',
        avatarUrl: null,
        phone: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        userId: m.userId,
        userName: prof.fullName,
        avatarUrl: prof.avatarUrl,
        user: prof,
        totalPaidPaise: paid,
        totalOwedPaise: owed,
        netBalancePaise: paid - owed,
      };
    });

    // Greedy min-cash-flow algorithm for suggested settlements
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    for (const b of balances) {
      if (b.netBalancePaise < 0) {
        debtors.push({ userId: b.userId, amount: -b.netBalancePaise });
      } else if (b.netBalancePaise > 0) {
        creditors.push({ userId: b.userId, amount: b.netBalancePaise });
      }
    }

    const suggested: SuggestedSettlement[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const deb = debtors[dIdx];
      const cred = creditors[cIdx];
      const transfer = Math.min(deb.amount, cred.amount);

      if (transfer > 0) {
        const fromUser = inMemoryStore.profiles.get(deb.userId) || {
          id: deb.userId,
          fullName: 'Roommate',
          avatarUrl: null,
          phone: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const toUser = inMemoryStore.profiles.get(cred.userId) || {
          id: cred.userId,
          fullName: 'Roommate',
          avatarUrl: null,
          phone: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        suggested.push({
          fromUserId: deb.userId,
          fromName: fromUser.fullName,
          fromUser,
          toUserId: cred.userId,
          toName: toUser.fullName,
          toUser,
          amountPaise: transfer,
        });
      }

      deb.amount -= transfer;
      cred.amount -= transfer;

      if (deb.amount === 0) dIdx++;
      if (cred.amount === 0) cIdx++;
    }

    return { balances, suggestedSettlements: suggested };
  }
}

export class MemoryBillRepository implements IBillRepository {
  async getBillsByFlat(flatId: string, status?: string): Promise<Bill[]> {
    let list = Array.from(inMemoryStore.bills.values()).filter((b) => b.flatId === flatId);
    if (status) list = list.filter((b) => b.status === status);
    return list.map((b) => ({
      ...b,
      shares: b.shares.map((s) => ({
        ...s,
        user: inMemoryStore.profiles.get(s.userId) || s.user,
      })),
    }));
  }

  async getBillById(billId: string): Promise<Bill | null> {
    const b = inMemoryStore.bills.get(billId);
    if (!b) return null;
    return {
      ...b,
      shares: b.shares.map((s) => ({
        ...s,
        user: inMemoryStore.profiles.get(s.userId) || s.user,
      })),
    };
  }

  async createBill(
    flatId: string,
    creatorId: string,
    input: CreateBillInput & { shares: Array<{ userId: string; sharePaise: number }> }
  ): Promise<Bill> {
    const billId = randomUUID();
    const nowIso = new Date().toISOString();

    const shares: BillShare[] = input.shares.map((s) => {
      const shareId = randomUUID();
      const obj: BillShare = {
        id: shareId,
        billId,
        userId: s.userId,
        sharePaise: s.sharePaise,
        paidAmountPaise: 0,
        status: 'pending',
        user: inMemoryStore.profiles.get(s.userId),
      };
      inMemoryStore.billShares.set(shareId, obj);
      return obj;
    });

    const bill: Bill = {
      id: billId,
      flatId,
      title: input.title,
      category: input.category,
      totalAmountPaise: input.totalAmountPaise,
      dueDate: input.dueDate,
      billingPeriod: input.billingPeriod,
      status: 'pending',
      createdBy: creatorId,
      createdAt: nowIso,
      shares,
    };
    inMemoryStore.bills.set(billId, bill);
    return bill;
  }

  async recordSharePayment(
    flatId: string,
    billId: string,
    shareId: string,
    amountPaise: number
  ): Promise<BillShare | null> {
    const bill = inMemoryStore.bills.get(billId);
    if (!bill || bill.flatId !== flatId) return null;

    const share = bill.shares.find((s) => s.id === shareId);
    if (!share) return null;

    share.paidAmountPaise += amountPaise;
    share.status = share.paidAmountPaise >= share.sharePaise ? 'paid' : 'pending';

    const allPaid = bill.shares.every((s) => s.status === 'paid');
    const anyPaid = bill.shares.some((s) => s.paidAmountPaise > 0);
    bill.status = allPaid ? 'paid' : anyPaid ? 'partially_paid' : 'pending';

    return share;
  }
}

export class MemoryChoreRepository implements IChoreRepository {
  async getChoresByFlat(flatId: string): Promise<Chore[]> {
    return Array.from(inMemoryStore.chores.values())
      .filter((c) => c.flatId === flatId)
      .map((c) => ({
        ...c,
        assignee: c.assignedTo ? inMemoryStore.profiles.get(c.assignedTo) : undefined,
      }))
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }

  async getChoreById(choreId: string): Promise<Chore | null> {
    const c = inMemoryStore.chores.get(choreId);
    if (!c) return null;
    return {
      ...c,
      assignee: c.assignedTo ? inMemoryStore.profiles.get(c.assignedTo) : undefined,
    };
  }

  async createChore(
    flatId: string,
    creatorId: string,
    data: {
      title: string;
      description?: string;
      assignedTo?: string | null;
      dueAt: string;
      priority?: ChorePriority;
      recurrenceRule?: ChoreRecurrence;
    }
  ): Promise<Chore> {
    const choreId = randomUUID();
    const chore: Chore = {
      id: choreId,
      flatId,
      title: data.title,
      description: data.description ?? null,
      assignedTo: data.assignedTo ?? null,
      createdBy: creatorId,
      dueAt: data.dueAt,
      priority: data.priority ?? 'medium',
      status: 'pending',
      recurrenceRule: data.recurrenceRule ?? 'none',
      completedAt: null,
      createdAt: new Date().toISOString(),
      assignee: data.assignedTo ? inMemoryStore.profiles.get(data.assignedTo) : undefined,
    };
    inMemoryStore.chores.set(choreId, chore);
    return chore;
  }

  async completeChore(choreId: string, userId: string): Promise<Chore | null> {
    const chore = inMemoryStore.chores.get(choreId);
    if (!chore) return null;
    chore.status = 'completed';
    chore.completedAt = new Date().toISOString();

    inMemoryStore.choreHistory.set(randomUUID(), {
      id: randomUUID(),
      choreId,
      userId,
      action: 'completed',
      createdAt: new Date().toISOString(),
    });

    return chore;
  }

  async rotateChores(flatId: string): Promise<{ rotatedCount: number; chores: Chore[] }> {
    const members = Array.from(inMemoryStore.flatMembers.values()).filter(
      (m) => m.flatId === flatId && m.status === 'active'
    );
    if (members.length === 0) return { rotatedCount: 0, chores: [] };

    const memberIds = members.map((m) => m.userId);
    const flatChores = Array.from(inMemoryStore.chores.values()).filter(
      (c) => c.flatId === flatId && c.status !== 'completed'
    );

    let rotatedCount = 0;
    for (const chore of flatChores) {
      if (chore.assignedTo) {
        const curIdx = memberIds.indexOf(chore.assignedTo);
        const nextIdx = (curIdx + 1) % memberIds.length;
        chore.assignedTo = memberIds[nextIdx];
        chore.assignee = inMemoryStore.profiles.get(chore.assignedTo);
        rotatedCount++;
      }
    }

    return { rotatedCount, chores: flatChores };
  }
}

export class MemoryGroceryRepository implements IGroceryRepository {
  async getOrCreateDefaultList(flatId: string, userId: string): Promise<GroceryList> {
    let list = Array.from(inMemoryStore.groceryLists.values()).find((l) => l.flatId === flatId);
    if (!list) {
      const listId = randomUUID();
      list = {
        id: listId,
        flatId,
        name: 'Shared Kitchen Essentials',
        createdBy: userId,
        createdAt: new Date().toISOString(),
      };
      inMemoryStore.groceryLists.set(listId, list);
    }
    return list;
  }

  async getGroceryItems(listId: string): Promise<GroceryItem[]> {
    return Array.from(inMemoryStore.groceryItems.values())
      .filter((i) => i.listId === listId)
      .map((i) => ({
        ...i,
        addedByUser: inMemoryStore.profiles.get(i.addedBy),
        assignedUser: i.assignedTo ? inMemoryStore.profiles.get(i.assignedTo) : undefined,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addItem(
    listId: string,
    addedBy: string,
    data: {
      name: string;
      quantity?: number;
      unit?: string;
      estimatedPricePaise?: number;
      assignedTo?: string | null;
    }
  ): Promise<GroceryItem> {
    const id = randomUUID();
    const item: GroceryItem = {
      id,
      listId,
      name: data.name,
      quantity: data.quantity ?? 1,
      unit: data.unit ?? 'units',
      estimatedPricePaise: data.estimatedPricePaise ?? 0,
      actualPricePaise: null,
      addedBy,
      assignedTo: data.assignedTo ?? null,
      isPurchased: false,
      purchasedAt: null,
      createdAt: new Date().toISOString(),
      addedByUser: inMemoryStore.profiles.get(addedBy),
      assignedUser: data.assignedTo ? inMemoryStore.profiles.get(data.assignedTo) : undefined,
    };
    inMemoryStore.groceryItems.set(id, item);
    return item;
  }

  async updateItem(
    itemId: string,
    patch: Partial<{
      name: string;
      quantity: number;
      unit: string;
      estimatedPricePaise: number;
      actualPricePaise: number | null;
      isPurchased: boolean;
      assignedTo: string | null;
    }>
  ): Promise<GroceryItem | null> {
    const item = inMemoryStore.groceryItems.get(itemId);
    if (!item) return null;

    Object.assign(item, patch);
    if (patch.isPurchased && !item.purchasedAt) {
      item.purchasedAt = new Date().toISOString();
    } else if (patch.isPurchased === false) {
      item.purchasedAt = null;
    }

    item.addedByUser = inMemoryStore.profiles.get(item.addedBy);
    item.assignedUser = item.assignedTo ? inMemoryStore.profiles.get(item.assignedTo) : undefined;
    return item;
  }

  async deleteItem(itemId: string): Promise<boolean> {
    return inMemoryStore.groceryItems.delete(itemId);
  }
}

export class MemoryMaintenanceRepository implements IMaintenanceRepository {
  async getRequestsByFlat(flatId: string, status?: string): Promise<MaintenanceRequest[]> {
    let list = Array.from(inMemoryStore.maintenanceRequests.values()).filter((r) => r.flatId === flatId);
    if (status) list = list.filter((r) => r.status === status);
    return list.map((r) => ({
      ...r,
      reporter: inMemoryStore.profiles.get(r.reportedBy),
      assignee: r.assignedTo ? inMemoryStore.profiles.get(r.assignedTo) : undefined,
      comments: (r.comments || []).map((c) => ({
        ...c,
        user: inMemoryStore.profiles.get(c.userId),
      })),
    }));
  }

  async getRequestById(requestId: string): Promise<MaintenanceRequest | null> {
    const r = inMemoryStore.maintenanceRequests.get(requestId);
    if (!r) return null;
    return {
      ...r,
      reporter: inMemoryStore.profiles.get(r.reportedBy),
      assignee: r.assignedTo ? inMemoryStore.profiles.get(r.assignedTo) : undefined,
      comments: (r.comments || []).map((c) => ({
        ...c,
        user: inMemoryStore.profiles.get(c.userId),
      })),
    };
  }

  async createRequest(
    flatId: string,
    reporterId: string,
    data: {
      title: string;
      description: string;
      location: string;
      priority?: MaintenancePriority;
      assignedTo?: string | null;
      imagePath?: string | null;
    }
  ): Promise<MaintenanceRequest> {
    const id = randomUUID();
    const nowIso = new Date().toISOString();
    const req: MaintenanceRequest = {
      id,
      flatId,
      title: data.title,
      description: data.description,
      location: data.location,
      priority: data.priority ?? 'medium',
      status: 'open',
      reportedBy: reporterId,
      assignedTo: data.assignedTo ?? null,
      imagePath: data.imagePath ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
      resolvedAt: null,
      comments: [],
      reporter: inMemoryStore.profiles.get(reporterId),
      assignee: data.assignedTo ? inMemoryStore.profiles.get(data.assignedTo) : undefined,
    };
    inMemoryStore.maintenanceRequests.set(id, req);
    return req;
  }

  async updateStatus(
    requestId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'cancelled'
  ): Promise<MaintenanceRequest | null> {
    const r = inMemoryStore.maintenanceRequests.get(requestId);
    if (!r) return null;
    r.status = status;
    r.updatedAt = new Date().toISOString();
    if (status === 'resolved') {
      r.resolvedAt = new Date().toISOString();
    }
    return r;
  }

  async addComment(requestId: string, userId: string, commentText: string): Promise<MaintenanceComment> {
    const r = inMemoryStore.maintenanceRequests.get(requestId);
    if (!r) throw new Error('Maintenance request not found');

    const comment: MaintenanceComment = {
      id: randomUUID(),
      requestId,
      userId,
      comment: commentText,
      createdAt: new Date().toISOString(),
      user: inMemoryStore.profiles.get(userId),
    };
    r.comments = r.comments || [];
    r.comments.push(comment);
    return comment;
  }
}

export class MemoryVisitorRepository implements IVisitorRepository {
  async getVisitorsByFlat(flatId: string): Promise<Visitor[]> {
    return Array.from(inMemoryStore.visitors.values())
      .filter((v) => v.flatId === flatId)
      .map((v) => ({
        ...v,
        host: inMemoryStore.profiles.get(v.hostId),
      }))
      .sort((a, b) => new Date(b.expectedArrival).getTime() - new Date(a.expectedArrival).getTime());
  }

  async createVisitor(
    flatId: string,
    data: {
      visitorName: string;
      hostId: string;
      purpose: string;
      expectedArrival: string;
      expectedDeparture: string;
      notes?: string | null;
    }
  ): Promise<Visitor> {
    const id = randomUUID();
    const visitor: Visitor = {
      id,
      flatId,
      visitorName: data.visitorName,
      hostId: data.hostId,
      purpose: data.purpose,
      expectedArrival: data.expectedArrival,
      expectedDeparture: data.expectedDeparture,
      checkedInAt: null,
      checkedOutAt: null,
      notes: data.notes ?? null,
      createdAt: new Date().toISOString(),
      host: inMemoryStore.profiles.get(data.hostId),
    };
    inMemoryStore.visitors.set(id, visitor);
    return visitor;
  }

  async checkInVisitor(visitorId: string): Promise<Visitor | null> {
    const v = inMemoryStore.visitors.get(visitorId);
    if (!v) return null;
    v.checkedInAt = new Date().toISOString();
    return v;
  }

  async checkOutVisitor(visitorId: string): Promise<Visitor | null> {
    const v = inMemoryStore.visitors.get(visitorId);
    if (!v) return null;
    v.checkedOutAt = new Date().toISOString();
    return v;
  }
}

export class MemoryAnnouncementRepository implements IAnnouncementRepository {
  async getAnnouncementsByFlat(flatId: string, _userId: string): Promise<Announcement[]> {
    return Array.from(inMemoryStore.announcements.values())
      .filter((a) => a.flatId === flatId)
      .map((a) => ({
        ...a,
        author: inMemoryStore.profiles.get(a.authorId),
      }))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }

  async createAnnouncement(
    flatId: string,
    authorId: string,
    data: { title: string; content: string; isPinned?: boolean }
  ): Promise<Announcement> {
    const id = randomUUID();
    const ann: Announcement = {
      id,
      flatId,
      authorId,
      title: data.title,
      content: data.content,
      isPinned: data.isPinned ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: inMemoryStore.profiles.get(authorId),
      readByCount: 0,
    };
    inMemoryStore.announcements.set(id, ann);
    return ann;
  }

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    const ann = inMemoryStore.announcements.get(announcementId);
    if (ann) {
      ann.readByCount = (ann.readByCount || 0) + 1;
    }
  }
}

export class MemoryEventRepository implements IEventRepository {
  async getEventsByFlat(flatId: string, _startIso?: string, _endIso?: string): Promise<CalendarEvent[]> {
    return Array.from(inMemoryStore.events.values())
      .filter((e) => e.flatId === flatId)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  async createEvent(
    flatId: string,
    creatorId: string,
    data: {
      title: string;
      description?: string;
      eventType?: string;
      startAt: string;
      endAt: string;
      linkedRecordType?: string | null;
      linkedRecordId?: string | null;
    }
  ): Promise<CalendarEvent> {
    const id = randomUUID();
    const ev: CalendarEvent = {
      id,
      flatId,
      title: data.title,
      description: data.description ?? null,
      eventType: (data.eventType ?? 'social') as EventType,
      startAt: data.startAt,
      endAt: data.endAt,
      createdBy: creatorId,
      linkedRecordType: data.linkedRecordType ?? null,
      linkedRecordId: data.linkedRecordId ?? null,
      createdAt: new Date().toISOString(),
    };
    inMemoryStore.events.set(id, ev);
    return ev;
  }
}

export class MemoryActivityRepository implements IActivityRepository {
  async getLogsByFlat(flatId: string, limit = 20): Promise<ActivityLog[]> {
    return inMemoryStore.activityLogs
      .filter((l) => l.flatId === flatId)
      .slice(-limit)
      .reverse()
      .map((l) => ({
        ...l,
        actor: inMemoryStore.profiles.get(l.actorId),
      }));
  }

  async logActivity(log: {
    flatId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValues?: unknown;
    newValues?: unknown;
  }): Promise<void> {
    inMemoryStore.activityLogs.push({
      id: randomUUID(),
      flatId: log.flatId,
      actorId: log.actorId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      previousValues: (log.previousValues as Record<string, unknown>) ?? null,
      newValues: (log.newValues as Record<string, unknown>) ?? null,
      createdAt: new Date().toISOString(),
      actor: inMemoryStore.profiles.get(log.actorId),
    });
  }
}

export function createMemoryRepositories(): IRepositories {
  return {
    flats: new MemoryFlatRepository(),
    profiles: new MemoryProfileRepository(),
    expenses: new MemoryExpenseRepository(),
    settlements: new MemorySettlementRepository(),
    bills: new MemoryBillRepository(),
    chores: new MemoryChoreRepository(),
    groceries: new MemoryGroceryRepository(),
    maintenance: new MemoryMaintenanceRepository(),
    visitors: new MemoryVisitorRepository(),
    announcements: new MemoryAnnouncementRepository(),
    events: new MemoryEventRepository(),
    activity: new MemoryActivityRepository(),
  };
}
