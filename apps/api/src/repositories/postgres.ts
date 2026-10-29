import { eq, and, desc, asc, ilike, inArray } from 'drizzle-orm';
import { getDb, schema } from '../db/index.js';
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
  ExpenseCategory,
  BillCategory,
} from '@flatflow/shared';
import type { FlatCreationRequest as FlatRequest } from './store.js';
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

function requireDb() {
  const db = getDb();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in apps/api/.env');
  }
  return db;
}

export class PgFlatRepository implements IFlatRepository {
  async getUserFlats(userId: string): Promise<UserFlatSummary[]> {
    const db = requireDb();
    const rows = await db
      .select({
        id: schema.flats.id,
        name: schema.flats.name,
        addressLabel: schema.flats.addressLabel,
        currency: schema.flats.currency,
        createdBy: schema.flats.createdBy,
        createdAt: schema.flats.createdAt,
        role: schema.flatMembers.role,
        joinedAt: schema.flatMembers.joinedAt,
      })
      .from(schema.flatMembers)
      .innerJoin(schema.flats, eq(schema.flatMembers.flatId, schema.flats.id))
      .where(and(eq(schema.flatMembers.userId, userId), eq(schema.flatMembers.status, 'active')));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      addressLabel: r.addressLabel,
      currency: r.currency,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      role: r.role as MemberRole,
      joinedAt: r.joinedAt.toISOString(),
    }));
  }

  async getFlatById(flatId: string): Promise<Flat | null> {
    const db = requireDb();
    const [row] = await db.select().from(schema.flats).where(eq(schema.flats.id, flatId)).limit(1);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      addressLabel: row.addressLabel,
      currency: row.currency,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createFlat(flatData: { name: string; addressLabel?: string | null; currency?: string; createdBy: string }): Promise<Flat> {
    const db = requireDb();

    return await db.transaction(async (tx) => {
      // 1. Ensure user profile exists
      const [existingProfile] = await tx
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.id, flatData.createdBy))
        .limit(1);

      if (!existingProfile) {
        await tx.insert(schema.profiles).values({
          id: flatData.createdBy,
          fullName: 'Flat Owner',
          avatarUrl: null,
          phone: null,
        });
      }

      // 2. Insert flat
      const [newFlat] = await tx
        .insert(schema.flats)
        .values({
          name: flatData.name,
          addressLabel: flatData.addressLabel ?? null,
          currency: flatData.currency ?? 'INR',
          createdBy: flatData.createdBy,
        })
        .returning();

      // 3. Add creator as owner member
      await tx.insert(schema.flatMembers).values({
        flatId: newFlat.id,
        userId: flatData.createdBy,
        role: 'owner',
        status: 'active',
      });

      // 4. Create default grocery list
      await tx.insert(schema.groceryLists).values({
        flatId: newFlat.id,
        name: 'Shared Kitchen Essentials',
        createdBy: flatData.createdBy,
      });

      return {
        id: newFlat.id,
        name: newFlat.name,
        addressLabel: newFlat.addressLabel,
        currency: newFlat.currency,
        createdBy: newFlat.createdBy,
        createdAt: newFlat.createdAt.toISOString(),
      };
    });
  }

  async getFlatMembers(flatId: string): Promise<FlatMemberWithProfile[]> {
    const db = requireDb();
    const rows = await db
      .select({
        member: schema.flatMembers,
        profile: schema.profiles,
      })
      .from(schema.flatMembers)
      .innerJoin(schema.profiles, eq(schema.flatMembers.userId, schema.profiles.id))
      .where(and(eq(schema.flatMembers.flatId, flatId), eq(schema.flatMembers.status, 'active')));

    return rows.map((r) => ({
      id: r.member.id,
      flatId: r.member.flatId,
      userId: r.member.userId,
      role: r.member.role as MemberRole,
      status: r.member.status as 'active' | 'invited' | 'left',
      joinedAt: r.member.joinedAt.toISOString(),
      profile: {
        id: r.profile.id,
        fullName: r.profile.fullName,
        avatarUrl: r.profile.avatarUrl,
        phone: r.profile.phone,
        createdAt: r.profile.createdAt.toISOString(),
        updatedAt: r.profile.updatedAt.toISOString(),
      },
    }));
  }

  async getFlatMember(flatId: string, userId: string): Promise<FlatMemberWithProfile | null> {
    const db = requireDb();
    const rows = await db
      .select({
        member: schema.flatMembers,
        profile: schema.profiles,
      })
      .from(schema.flatMembers)
      .innerJoin(schema.profiles, eq(schema.flatMembers.userId, schema.profiles.id))
      .where(and(eq(schema.flatMembers.flatId, flatId), eq(schema.flatMembers.userId, userId), eq(schema.flatMembers.status, 'active')))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.member.id,
      flatId: r.member.flatId,
      userId: r.member.userId,
      role: r.member.role as MemberRole,
      status: r.member.status as 'active' | 'invited' | 'left',
      joinedAt: r.member.joinedAt.toISOString(),
      profile: {
        id: r.profile.id,
        fullName: r.profile.fullName,
        avatarUrl: r.profile.avatarUrl,
        phone: r.profile.phone,
        createdAt: r.profile.createdAt.toISOString(),
        updatedAt: r.profile.updatedAt.toISOString(),
      },
    };
  }

  async addMember(data: { flatId: string; userId: string; role: MemberRole; status?: 'active' | 'invited' }): Promise<FlatMemberWithProfile> {
    const db = requireDb();
    return await db.transaction(async (tx) => {
      // Ensure profile exists
      const [profileRow] = await tx.select().from(schema.profiles).where(eq(schema.profiles.id, data.userId)).limit(1);
      let profile = profileRow;
      if (!profile) {
        const [created] = await tx
          .insert(schema.profiles)
          .values({ id: data.userId, fullName: 'Roommate' })
          .returning();
        profile = created;
      }

      const [member] = await tx
        .insert(schema.flatMembers)
        .values({
          flatId: data.flatId,
          userId: data.userId,
          role: data.role,
          status: data.status ?? 'active',
        })
        .onConflictDoUpdate({
          target: [schema.flatMembers.flatId, schema.flatMembers.userId],
          set: {
            role: data.role,
            status: data.status ?? 'active',
          },
        })
        .returning();

      return {
        id: member.id,
        flatId: member.flatId,
        userId: member.userId,
        role: member.role as MemberRole,
        status: member.status as 'active' | 'invited' | 'left',
        joinedAt: member.joinedAt.toISOString(),
        profile: {
          id: profile.id,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          phone: profile.phone,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        },
      };
    });
  }

  async updateMemberRole(flatId: string, memberId: string, role: MemberRole): Promise<FlatMemberWithProfile | null> {
    const db = requireDb();
    const [updated] = await db
      .update(schema.flatMembers)
      .set({ role })
      .where(and(eq(schema.flatMembers.id, memberId), eq(schema.flatMembers.flatId, flatId)))
      .returning();

    if (!updated) return null;
    const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, updated.userId)).limit(1);

    return {
      id: updated.id,
      flatId: updated.flatId,
      userId: updated.userId,
      role: updated.role as MemberRole,
      status: updated.status as 'active' | 'invited' | 'left',
      joinedAt: updated.joinedAt.toISOString(),
      profile: p
        ? {
            id: p.id,
            fullName: p.fullName,
            avatarUrl: p.avatarUrl,
            phone: p.phone,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          }
        : {
            id: updated.userId,
            fullName: 'Roommate',
            avatarUrl: null,
            phone: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
    };
  }

  async removeMember(flatId: string, memberId: string): Promise<boolean> {
    const db = requireDb();
    const result = await db
      .update(schema.flatMembers)
      .set({ status: 'left' })
      .where(and(eq(schema.flatMembers.id, memberId), eq(schema.flatMembers.flatId, flatId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getInviteByCode(code: string) {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(schema.flatInvites)
      .where(eq(schema.flatInvites.code, code.trim().toUpperCase()))
      .limit(1);

    if (!row) return null;
    return {
      id: row.id,
      flatId: row.flatId,
      code: row.code,
      expiresAt: row.expiresAt.toISOString(),
      maxUses: row.maxUses,
      useCount: row.useCount,
    };
  }

  async createInvite(flatId: string, invitedBy: string) {
    const db = requireDb();
    const code = `DOME-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const [row] = await db
      .insert(schema.flatInvites)
      .values({
        flatId,
        invitedBy,
        code,
        tokenHash: `hash-${code}`,
        expiresAt: new Date(Date.now() + 30 * 86400000),
        maxUses: 10,
        useCount: 0,
      })
      .returning();

    return { id: row.id, flatId: row.flatId, code: row.code };
  }

  async useInvite(inviteId: string): Promise<void> {
    const db = requireDb();
    const [row] = await db.select().from(schema.flatInvites).where(eq(schema.flatInvites.id, inviteId)).limit(1);
    if (row) {
      await db
        .update(schema.flatInvites)
        .set({ useCount: row.useCount + 1 })
        .where(eq(schema.flatInvites.id, inviteId));
    }
  }

  async getPendingFlatRequests(): Promise<FlatRequest[]> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.flatRequests)
      .where(eq(schema.flatRequests.status, 'pending'))
      .orderBy(desc(schema.flatRequests.createdAt));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      addressLabel: r.addressLabel ?? '',
      currency: r.currency,
      requestedBy: r.requestedBy,
      requesterName: r.requesterName,
      status: r.status as 'pending' | 'approved' | 'rejected',
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : undefined,
    }));
  }

  async createFlatRequest(data: { name: string; addressLabel?: string; currency?: string; requestedBy: string; requesterName: string }): Promise<FlatRequest> {
    const db = requireDb();
    const [row] = await db
      .insert(schema.flatRequests)
      .values({
        name: data.name,
        addressLabel: data.addressLabel ?? null,
        currency: data.currency ?? 'INR',
        requestedBy: data.requestedBy,
        requesterName: data.requesterName,
        status: 'pending',
      })
      .returning();

    return {
      id: row.id,
      name: row.name,
      addressLabel: row.addressLabel ?? '',
      currency: row.currency,
      requestedBy: row.requestedBy,
      requesterName: row.requesterName,
      status: row.status as 'pending' | 'approved' | 'rejected',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async approveFlatRequest(requestId: string, adminId: string): Promise<{ request: FlatRequest; flat: Flat }> {
    const db = requireDb();
    return await db.transaction(async (tx) => {
      const [req] = await tx
        .update(schema.flatRequests)
        .set({ status: 'approved', approvedAt: new Date() })
        .where(eq(schema.flatRequests.id, requestId))
        .returning();

      if (!req) throw new Error('Flat request not found');

      // Create flat
      const [newFlat] = await tx
        .insert(schema.flats)
        .values({
          name: req.name,
          addressLabel: req.addressLabel,
          currency: req.currency,
          createdBy: req.requestedBy,
        })
        .returning();

      // Add requester as owner member
      await tx.insert(schema.flatMembers).values({
        flatId: newFlat.id,
        userId: req.requestedBy,
        role: 'owner',
        status: 'active',
      });

      // Add admin as admin member
      if (adminId !== req.requestedBy) {
        await tx.insert(schema.flatMembers).values({
          flatId: newFlat.id,
          userId: adminId,
          role: 'admin',
          status: 'active',
        });
      }

      // Default grocery list
      await tx.insert(schema.groceryLists).values({
        flatId: newFlat.id,
        name: 'Shared Kitchen Essentials',
        createdBy: req.requestedBy,
      });

      const formattedReq: FlatRequest = {
        id: req.id,
        name: req.name,
        addressLabel: req.addressLabel ?? '',
        currency: req.currency,
        requestedBy: req.requestedBy,
        requesterName: req.requesterName,
        status: 'approved',
        createdAt: req.createdAt.toISOString(),
        approvedAt: req.approvedAt?.toISOString(),
      };

      const formattedFlat: Flat = {
        id: newFlat.id,
        name: newFlat.name,
        addressLabel: newFlat.addressLabel,
        currency: newFlat.currency,
        createdBy: newFlat.createdBy,
        createdAt: newFlat.createdAt.toISOString(),
      };

      return { request: formattedReq, flat: formattedFlat };
    });
  }

  async rejectFlatRequest(requestId: string, _adminId: string): Promise<FlatRequest> {
    const db = requireDb();
    const [req] = await db
      .update(schema.flatRequests)
      .set({ status: 'rejected' })
      .where(eq(schema.flatRequests.id, requestId))
      .returning();

    if (!req) throw new Error('Flat request not found');
    return {
      id: req.id,
      name: req.name,
      addressLabel: req.addressLabel ?? '',
      currency: req.currency,
      requestedBy: req.requestedBy,
      requesterName: req.requesterName,
      status: 'rejected',
      createdAt: req.createdAt.toISOString(),
    };
  }
}

export class PgProfileRepository implements IProfileRepository {
  async getProfileById(id: string): Promise<UserProfile | null> {
    const db = requireDb();
    const [row] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id)).limit(1);
    if (!row) return null;
    return {
      id: row.id,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      phone: row.phone,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async upsertProfile(data: Partial<UserProfile> & { id: string; fullName: string }): Promise<UserProfile> {
    const db = requireDb();
    const [row] = await db
      .insert(schema.profiles)
      .values({
        id: data.id,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl ?? null,
        phone: data.phone ?? null,
      })
      .onConflictDoUpdate({
        target: schema.profiles.id,
        set: {
          fullName: data.fullName,
          avatarUrl: data.avatarUrl ?? null,
          phone: data.phone ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      id: row.id,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      phone: row.phone,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getProfilesByIds(ids: string[]): Promise<Map<string, UserProfile>> {
    const db = requireDb();
    if (ids.length === 0) return new Map();
    const rows = await db.select().from(schema.profiles).where(inArray(schema.profiles.id, ids));
    const map = new Map<string, UserProfile>();
    for (const r of rows) {
      map.set(r.id, {
        id: r.id,
        fullName: r.fullName,
        avatarUrl: r.avatarUrl,
        phone: r.phone,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      });
    }
    return map;
  }
}

export class PgExpenseRepository implements IExpenseRepository {
  async getExpensesByFlat(
    flatId: string,
    filters?: { category?: string; payerId?: string; search?: string }
  ): Promise<Expense[]> {
    const db = requireDb();
    let query = db
      .select({
        expense: schema.expenses,
        payer: schema.profiles,
      })
      .from(schema.expenses)
      .innerJoin(schema.profiles, eq(schema.expenses.payerId, schema.profiles.id))
      .where(eq(schema.expenses.flatId, flatId))
      .orderBy(desc(schema.expenses.expenseDate));

    const rows = await query;

    let filtered = rows;
    if (filters?.category) filtered = filtered.filter((r) => r.expense.category === filters.category);
    if (filters?.payerId) filtered = filtered.filter((r) => r.expense.payerId === filters.payerId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((r) => r.expense.description.toLowerCase().includes(q));
    }

    if (filtered.length === 0) return [];

    const expenseIds = filtered.map((r) => r.expense.id);
    const splitsRows = await db
      .select({
        split: schema.expenseSplits,
        user: schema.profiles,
      })
      .from(schema.expenseSplits)
      .innerJoin(schema.profiles, eq(schema.expenseSplits.userId, schema.profiles.id))
      .where(inArray(schema.expenseSplits.expenseId, expenseIds));

    const splitsByExpense = new Map<string, ExpenseSplit[]>();
    for (const s of splitsRows) {
      const arr = splitsByExpense.get(s.split.expenseId) || [];
      arr.push({
        id: s.split.id,
        expenseId: s.split.expenseId,
        userId: s.split.userId,
        sharePaise: s.split.sharePaise,
        user: {
          id: s.user.id,
          fullName: s.user.fullName,
          avatarUrl: s.user.avatarUrl,
          phone: s.user.phone,
          createdAt: s.user.createdAt.toISOString(),
          updatedAt: s.user.updatedAt.toISOString(),
        },
      });
      splitsByExpense.set(s.split.expenseId, arr);
    }

    return filtered.map((r) => ({
      id: r.expense.id,
      flatId: r.expense.flatId,
      payerId: r.expense.payerId,
      description: r.expense.description,
      category: r.expense.category as ExpenseCategory,
      amountPaise: r.expense.amountPaise,
      expenseDate: r.expense.expenseDate,
      receiptPath: r.expense.receiptPath,
      createdAt: r.expense.createdAt.toISOString(),
      updatedAt: r.expense.updatedAt.toISOString(),
      payer: {
        id: r.payer.id,
        fullName: r.payer.fullName,
        avatarUrl: r.payer.avatarUrl,
        phone: r.payer.phone,
        createdAt: r.payer.createdAt.toISOString(),
        updatedAt: r.payer.updatedAt.toISOString(),
      },
      splits: splitsByExpense.get(r.expense.id) || [],
    }));
  }

  async getExpenseById(expenseId: string): Promise<Expense | null> {
    const db = requireDb();
    const rows = await db
      .select({
        expense: schema.expenses,
        payer: schema.profiles,
      })
      .from(schema.expenses)
      .innerJoin(schema.profiles, eq(schema.expenses.payerId, schema.profiles.id))
      .where(eq(schema.expenses.id, expenseId))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    const splitsRows = await db
      .select({
        split: schema.expenseSplits,
        user: schema.profiles,
      })
      .from(schema.expenseSplits)
      .innerJoin(schema.profiles, eq(schema.expenseSplits.userId, schema.profiles.id))
      .where(eq(schema.expenseSplits.expenseId, expenseId));

    return {
      id: r.expense.id,
      flatId: r.expense.flatId,
      payerId: r.expense.payerId,
      description: r.expense.description,
      category: r.expense.category as ExpenseCategory,
      amountPaise: r.expense.amountPaise,
      expenseDate: r.expense.expenseDate,
      receiptPath: r.expense.receiptPath,
      createdAt: r.expense.createdAt.toISOString(),
      updatedAt: r.expense.updatedAt.toISOString(),
      payer: {
        id: r.payer.id,
        fullName: r.payer.fullName,
        avatarUrl: r.payer.avatarUrl,
        phone: r.payer.phone,
        createdAt: r.payer.createdAt.toISOString(),
        updatedAt: r.payer.updatedAt.toISOString(),
      },
      splits: splitsRows.map((s) => ({
        id: s.split.id,
        expenseId: s.split.expenseId,
        userId: s.split.userId,
        sharePaise: s.split.sharePaise,
        user: {
          id: s.user.id,
          fullName: s.user.fullName,
          avatarUrl: s.user.avatarUrl,
          phone: s.user.phone,
          createdAt: s.user.createdAt.toISOString(),
          updatedAt: s.user.updatedAt.toISOString(),
        },
      })),
    };
  }

  async createExpense(flatId: string, creatorId: string, input: CreateExpenseInput): Promise<Expense> {
    const db = requireDb();

    return await db.transaction(async (tx) => {
      // 1. Insert expense
      const [exp] = await tx
        .insert(schema.expenses)
        .values({
          flatId,
          payerId: input.payerId,
          description: input.description,
          category: input.category,
          amountPaise: input.amountPaise,
          expenseDate: input.expenseDate,
          receiptPath: input.receiptPath ?? null,
        })
        .returning();

      // 2. Batch insert splits
      const splitInserts = input.splits.map((s) => ({
        expenseId: exp.id,
        userId: s.userId,
        sharePaise: s.sharePaise,
      }));

      const createdSplits = await tx.insert(schema.expenseSplits).values(splitInserts).returning();

      // 3. Log activity
      await tx.insert(schema.activityLogs).values({
        flatId,
        actorId: creatorId,
        action: 'created_expense',
        entityType: 'expense',
        entityId: exp.id,
        newValues: JSON.stringify({ description: input.description, amountPaise: input.amountPaise }),
      });

      // 4. Fetch profiles for splits & payer
      const userIds = [input.payerId, ...input.splits.map((s) => s.userId)];
      const profileRows = await tx.select().from(schema.profiles).where(inArray(schema.profiles.id, userIds));
      const profileMap = new Map(profileRows.map((p) => [p.id, p]));

      const payerP = profileMap.get(input.payerId);

      return {
        id: exp.id,
        flatId: exp.flatId,
        payerId: exp.payerId,
        description: exp.description,
        category: exp.category as ExpenseCategory,
        amountPaise: exp.amountPaise,
        expenseDate: exp.expenseDate,
        receiptPath: exp.receiptPath,
        createdAt: exp.createdAt.toISOString(),
        updatedAt: exp.updatedAt.toISOString(),
        payer: payerP
          ? {
              id: payerP.id,
              fullName: payerP.fullName,
              avatarUrl: payerP.avatarUrl,
              phone: payerP.phone,
              createdAt: payerP.createdAt.toISOString(),
              updatedAt: payerP.updatedAt.toISOString(),
            }
          : undefined,
        splits: createdSplits.map((s) => {
          const u = profileMap.get(s.userId);
          return {
            id: s.id,
            expenseId: s.expenseId,
            userId: s.userId,
            sharePaise: s.sharePaise,
            user: u
              ? {
                  id: u.id,
                  fullName: u.fullName,
                  avatarUrl: u.avatarUrl,
                  phone: u.phone,
                  createdAt: u.createdAt.toISOString(),
                  updatedAt: u.updatedAt.toISOString(),
                }
              : undefined,
          };
        }),
      };
    });
  }

  async deleteExpense(expenseId: string, flatId: string, actorId: string): Promise<boolean> {
    const db = requireDb();
    return await db.transaction(async (tx) => {
      const [exp] = await tx
        .select()
        .from(schema.expenses)
        .where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.flatId, flatId)))
        .limit(1);

      if (!exp) return false;

      await tx.delete(schema.expenseSplits).where(eq(schema.expenseSplits.expenseId, expenseId));
      await tx.delete(schema.expenses).where(eq(schema.expenses.id, expenseId));

      await tx.insert(schema.activityLogs).values({
        flatId,
        actorId,
        action: 'deleted_expense',
        entityType: 'expense',
        entityId: expenseId,
        previousValues: JSON.stringify({ description: exp.description, amountPaise: exp.amountPaise }),
      });

      return true;
    });
  }
}

export class PgSettlementRepository implements ISettlementRepository {
  async getSettlementsByFlat(flatId: string): Promise<Settlement[]> {
    const db = requireDb();
    const rows = await db
      .select({
        settlement: schema.settlements,
        payer: schema.profiles,
      })
      .from(schema.settlements)
      .innerJoin(schema.profiles, eq(schema.settlements.payerId, schema.profiles.id))
      .where(eq(schema.settlements.flatId, flatId))
      .orderBy(desc(schema.settlements.createdAt));

    if (rows.length === 0) return [];

    const receiverIds = rows.map((r) => r.settlement.receiverId);
    const receivers = await db.select().from(schema.profiles).where(inArray(schema.profiles.id, receiverIds));
    const receiverMap = new Map(receivers.map((rc) => [rc.id, rc]));

    return rows.map((r) => {
      const rec = receiverMap.get(r.settlement.receiverId);
      return {
        id: r.settlement.id,
        flatId: r.settlement.flatId,
        payerId: r.settlement.payerId,
        receiverId: r.settlement.receiverId,
        amountPaise: r.settlement.amountPaise,
        status: r.settlement.status as 'pending' | 'completed' | 'cancelled',
        settledAt: r.settlement.settledAt?.toISOString() ?? null,
        createdAt: r.settlement.createdAt.toISOString(),
        payer: {
          id: r.payer.id,
          fullName: r.payer.fullName,
          avatarUrl: r.payer.avatarUrl,
          phone: r.payer.phone,
          createdAt: r.payer.createdAt.toISOString(),
          updatedAt: r.payer.updatedAt.toISOString(),
        },
        receiver: rec
          ? {
              id: rec.id,
              fullName: rec.fullName,
              avatarUrl: rec.avatarUrl,
              phone: rec.phone,
              createdAt: rec.createdAt.toISOString(),
              updatedAt: rec.updatedAt.toISOString(),
            }
          : undefined,
      };
    });
  }

  async createSettlement(
    flatId: string,
    actorId: string,
    data: { payerId: string; receiverId: string; amountPaise: number }
  ): Promise<Settlement> {
    const db = requireDb();
    return await db.transaction(async (tx) => {
      const [settlement] = await tx
        .insert(schema.settlements)
        .values({
          flatId,
          payerId: data.payerId,
          receiverId: data.receiverId,
          amountPaise: data.amountPaise,
          status: 'completed',
          settledAt: new Date(),
        })
        .returning();

      await tx.insert(schema.activityLogs).values({
        flatId,
        actorId,
        action: 'recorded_settlement',
        entityType: 'settlement',
        entityId: settlement.id,
        newValues: JSON.stringify({ amountPaise: data.amountPaise }),
      });

      const [p] = await tx.select().from(schema.profiles).where(eq(schema.profiles.id, data.payerId)).limit(1);
      const [rc] = await tx.select().from(schema.profiles).where(eq(schema.profiles.id, data.receiverId)).limit(1);

      return {
        id: settlement.id,
        flatId: settlement.flatId,
        payerId: settlement.payerId,
        receiverId: settlement.receiverId,
        amountPaise: settlement.amountPaise,
        status: settlement.status as 'pending' | 'completed' | 'cancelled',
        settledAt: settlement.settledAt?.toISOString() ?? null,
        createdAt: settlement.createdAt.toISOString(),
        payer: p
          ? {
              id: p.id,
              fullName: p.fullName,
              avatarUrl: p.avatarUrl,
              phone: p.phone,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
            }
          : undefined,
        receiver: rc
          ? {
              id: rc.id,
              fullName: rc.fullName,
              avatarUrl: rc.avatarUrl,
              phone: rc.phone,
              createdAt: rc.createdAt.toISOString(),
              updatedAt: rc.updatedAt.toISOString(),
            }
          : undefined,
      };
    });
  }

  async calculateBalances(flatId: string): Promise<{
    balances: BalanceSummary[];
    suggestedSettlements: SuggestedSettlement[];
  }> {
    const db = requireDb();

    // 1. Get flat members
    const members = await db
      .select({
        member: schema.flatMembers,
        profile: schema.profiles,
      })
      .from(schema.flatMembers)
      .innerJoin(schema.profiles, eq(schema.flatMembers.userId, schema.profiles.id))
      .where(and(eq(schema.flatMembers.flatId, flatId), eq(schema.flatMembers.status, 'active')));

    const paidMap = new Map<string, number>();
    const owedMap = new Map<string, number>();
    const profileMap = new Map<string, UserProfile>();

    for (const m of members) {
      paidMap.set(m.member.userId, 0);
      owedMap.set(m.member.userId, 0);
      profileMap.set(m.member.userId, {
        id: m.profile.id,
        fullName: m.profile.fullName,
        avatarUrl: m.profile.avatarUrl,
        phone: m.profile.phone,
        createdAt: m.profile.createdAt.toISOString(),
        updatedAt: m.profile.updatedAt.toISOString(),
      });
    }

    // 2. Fetch expenses
    const expenses = await db.select().from(schema.expenses).where(eq(schema.expenses.flatId, flatId));
    if (expenses.length > 0) {
      const expIds = expenses.map((e) => e.id);
      const splits = await db.select().from(schema.expenseSplits).where(inArray(schema.expenseSplits.expenseId, expIds));

      for (const e of expenses) {
        paidMap.set(e.payerId, (paidMap.get(e.payerId) || 0) + e.amountPaise);
      }
      for (const s of splits) {
        owedMap.set(s.userId, (owedMap.get(s.userId) || 0) + s.sharePaise);
      }
    }

    // 3. Fetch settlements
    const settlements = await db
      .select()
      .from(schema.settlements)
      .where(and(eq(schema.settlements.flatId, flatId), eq(schema.settlements.status, 'completed')));

    for (const s of settlements) {
      paidMap.set(s.payerId, (paidMap.get(s.payerId) || 0) + s.amountPaise);
      owedMap.set(s.receiverId, (owedMap.get(s.receiverId) || 0) + s.amountPaise);
    }

    const balances: BalanceSummary[] = members.map((m) => {
      const uid = m.member.userId;
      const prof = profileMap.get(uid);
      const paid = paidMap.get(uid) || 0;
      const owed = owedMap.get(uid) || 0;
      return {
        userId: uid,
        userName: prof?.fullName || 'Roommate',
        avatarUrl: prof?.avatarUrl || null,
        user: prof!,
        totalPaidPaise: paid,
        totalOwedPaise: owed,
        netBalancePaise: paid - owed,
      };
    });

    // Greedy min-cash-flow
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
        const fromProf = profileMap.get(deb.userId);
        const toProf = profileMap.get(cred.userId);
        suggested.push({
          fromUserId: deb.userId,
          fromName: fromProf?.fullName || 'Roommate',
          fromUser: fromProf!,
          toUserId: cred.userId,
          toName: toProf?.fullName || 'Roommate',
          toUser: toProf!,
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

export class PgBillRepository implements IBillRepository {
  async getBillsByFlat(flatId: string, status?: string): Promise<Bill[]> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.bills)
      .where(eq(schema.bills.flatId, flatId))
      .orderBy(asc(schema.bills.dueDate));

    let filtered = rows;
    if (status) filtered = filtered.filter((b) => b.status === status);

    if (filtered.length === 0) return [];

    const billIds = filtered.map((b) => b.id);
    const sharesRows = await db
      .select({
        share: schema.billShares,
        user: schema.profiles,
      })
      .from(schema.billShares)
      .innerJoin(schema.profiles, eq(schema.billShares.userId, schema.profiles.id))
      .where(inArray(schema.billShares.billId, billIds));

    const sharesByBill = new Map<string, BillShare[]>();
    for (const s of sharesRows) {
      const arr = sharesByBill.get(s.share.billId) || [];
      arr.push({
        id: s.share.id,
        billId: s.share.billId,
        userId: s.share.userId,
        sharePaise: s.share.sharePaise,
        paidAmountPaise: s.share.paidAmountPaise,
        status: (s.share.paidAmountPaise >= s.share.sharePaise ? 'paid' : 'pending') as 'pending' | 'paid',
        user: {
          id: s.user.id,
          fullName: s.user.fullName,
          avatarUrl: s.user.avatarUrl,
          phone: s.user.phone,
          createdAt: s.user.createdAt.toISOString(),
          updatedAt: s.user.updatedAt.toISOString(),
        },
      });
      sharesByBill.set(s.share.billId, arr);
    }

    return filtered.map((b) => ({
      id: b.id,
      flatId: b.flatId,
      title: b.title,
      category: b.category as BillCategory,
      totalAmountPaise: b.totalAmountPaise,
      dueDate: b.dueDate,
      billingPeriod: b.billingPeriod,
      status: b.status as 'pending' | 'partially_paid' | 'paid' | 'overdue',
      createdBy: b.createdBy,
      createdAt: b.createdAt.toISOString(),
      shares: sharesByBill.get(b.id) || [],
    }));
  }

  async getBillById(billId: string): Promise<Bill | null> {
    const db = requireDb();
    const [b] = await db.select().from(schema.bills).where(eq(schema.bills.id, billId)).limit(1);
    if (!b) return null;

    const sharesRows = await db
      .select({
        share: schema.billShares,
        user: schema.profiles,
      })
      .from(schema.billShares)
      .innerJoin(schema.profiles, eq(schema.billShares.userId, schema.profiles.id))
      .where(eq(schema.billShares.billId, billId));

    return {
      id: b.id,
      flatId: b.flatId,
      title: b.title,
      category: b.category as BillCategory,
      totalAmountPaise: b.totalAmountPaise,
      dueDate: b.dueDate,
      billingPeriod: b.billingPeriod,
      status: b.status as 'pending' | 'partially_paid' | 'paid' | 'overdue',
      createdBy: b.createdBy,
      createdAt: b.createdAt.toISOString(),
      shares: sharesRows.map((s) => ({
        id: s.share.id,
        billId: s.share.billId,
        userId: s.share.userId,
        sharePaise: s.share.sharePaise,
        paidAmountPaise: s.share.paidAmountPaise,
        status: (s.share.paidAmountPaise >= s.share.sharePaise ? 'paid' : 'pending') as 'pending' | 'paid',
        user: {
          id: s.user.id,
          fullName: s.user.fullName,
          avatarUrl: s.user.avatarUrl,
          phone: s.user.phone,
          createdAt: s.user.createdAt.toISOString(),
          updatedAt: s.user.updatedAt.toISOString(),
        },
      })),
    };
  }

  async createBill(
    flatId: string,
    creatorId: string,
    input: CreateBillInput & { shares: Array<{ userId: string; sharePaise: number }> }
  ): Promise<Bill> {
    const db = requireDb();

    return await db.transaction(async (tx) => {
      const [bill] = await tx
        .insert(schema.bills)
        .values({
          flatId,
          title: input.title,
          category: input.category,
          totalAmountPaise: input.totalAmountPaise,
          dueDate: input.dueDate,
          billingPeriod: input.billingPeriod,
          status: 'pending',
          createdBy: creatorId,
        })
        .returning();

      const shareInserts = input.shares.map((s: { userId: string; sharePaise: number }) => ({
        billId: bill.id,
        userId: s.userId,
        sharePaise: s.sharePaise,
        paidAmountPaise: 0,
        status: 'pending',
      }));

      const createdShares = await tx.insert(schema.billShares).values(shareInserts).returning();

      const userIds = input.shares.map((s: { userId: string; sharePaise: number }) => s.userId);
      const profileRows = await tx.select().from(schema.profiles).where(inArray(schema.profiles.id, userIds));
      const profileMap = new Map(profileRows.map((p) => [p.id, p]));

      return {
        id: bill.id,
        flatId: bill.flatId,
        title: bill.title,
        category: bill.category as BillCategory,
        totalAmountPaise: bill.totalAmountPaise,
        dueDate: bill.dueDate,
        billingPeriod: bill.billingPeriod,
        status: 'pending',
        createdBy: bill.createdBy,
        createdAt: bill.createdAt.toISOString(),
        shares: createdShares.map((s) => {
          const u = profileMap.get(s.userId);
          return {
            id: s.id,
            billId: s.billId,
            userId: s.userId,
            sharePaise: s.sharePaise,
            paidAmountPaise: s.paidAmountPaise,
            status: (s.paidAmountPaise >= s.sharePaise ? 'paid' : 'pending') as 'pending' | 'paid',
            user: u
              ? {
                  id: u.id,
                  fullName: u.fullName,
                  avatarUrl: u.avatarUrl,
                  phone: u.phone,
                  createdAt: u.createdAt.toISOString(),
                  updatedAt: u.updatedAt.toISOString(),
                }
              : undefined,
          };
        }),
      };
    });
  }

  async recordSharePayment(
    flatId: string,
    billId: string,
    shareId: string,
    amountPaise: number
  ): Promise<BillShare | null> {
    const db = requireDb();

    return await db.transaction(async (tx) => {
      const [share] = await tx
        .select()
        .from(schema.billShares)
        .where(eq(schema.billShares.id, shareId))
        .limit(1);

      if (!share || share.billId !== billId) return null;

      const newPaid = share.paidAmountPaise + amountPaise;
      const newStatus = newPaid >= share.sharePaise ? 'paid' : 'pending';

      const [updatedShare] = await tx
        .update(schema.billShares)
        .set({ paidAmountPaise: newPaid, status: newStatus })
        .where(eq(schema.billShares.id, shareId))
        .returning();

      // Recalculate bill status
      const allShares = await tx.select().from(schema.billShares).where(eq(schema.billShares.billId, billId));
      const allPaid = allShares.every((s) => s.status === 'paid');
      const anyPaid = allShares.some((s) => s.paidAmountPaise > 0);
      const billStatus = allPaid ? 'paid' : anyPaid ? 'partially_paid' : 'pending';

      await tx.update(schema.bills).set({ status: billStatus }).where(eq(schema.bills.id, billId));

      const [u] = await tx.select().from(schema.profiles).where(eq(schema.profiles.id, updatedShare.userId)).limit(1);

      return {
        id: updatedShare.id,
        billId: updatedShare.billId,
        userId: updatedShare.userId,
        sharePaise: updatedShare.sharePaise,
        paidAmountPaise: updatedShare.paidAmountPaise,
        status: (updatedShare.paidAmountPaise >= updatedShare.sharePaise ? 'paid' : 'pending') as 'pending' | 'paid',
        user: u
          ? {
              id: u.id,
              fullName: u.fullName,
              avatarUrl: u.avatarUrl,
              phone: u.phone,
              createdAt: u.createdAt.toISOString(),
              updatedAt: u.updatedAt.toISOString(),
            }
          : undefined,
      };
    });
  }
}

export class PgChoreRepository implements IChoreRepository {
  async getChoresByFlat(flatId: string): Promise<Chore[]> {
    const db = requireDb();
    const rows = await db
      .select({
        chore: schema.chores,
        assignee: schema.profiles,
      })
      .from(schema.chores)
      .leftJoin(schema.profiles, eq(schema.chores.assignedTo, schema.profiles.id))
      .where(eq(schema.chores.flatId, flatId))
      .orderBy(asc(schema.chores.dueAt));

    return rows.map((r) => ({
      id: r.chore.id,
      flatId: r.chore.flatId,
      title: r.chore.title,
      description: r.chore.description,
      assignedTo: r.chore.assignedTo,
      createdBy: r.chore.createdBy,
      dueAt: r.chore.dueAt.toISOString(),
      priority: r.chore.priority as ChorePriority,
      status: r.chore.status as 'pending' | 'in_progress' | 'completed' | 'overdue',
      recurrenceRule: r.chore.recurrenceRule as ChoreRecurrence,
      completedAt: r.chore.completedAt ? r.chore.completedAt.toISOString() : null,
      createdAt: r.chore.createdAt.toISOString(),
      assignee: r.assignee
        ? {
            id: r.assignee.id,
            fullName: r.assignee.fullName,
            avatarUrl: r.assignee.avatarUrl,
            phone: r.assignee.phone,
            createdAt: r.assignee.createdAt.toISOString(),
            updatedAt: r.assignee.updatedAt.toISOString(),
          }
        : undefined,
    }));
  }

  async getChoreById(choreId: string): Promise<Chore | null> {
    const db = requireDb();
    const rows = await db
      .select({
        chore: schema.chores,
        assignee: schema.profiles,
      })
      .from(schema.chores)
      .leftJoin(schema.profiles, eq(schema.chores.assignedTo, schema.profiles.id))
      .where(eq(schema.chores.id, choreId))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.chore.id,
      flatId: r.chore.flatId,
      title: r.chore.title,
      description: r.chore.description,
      assignedTo: r.chore.assignedTo,
      createdBy: r.chore.createdBy,
      dueAt: r.chore.dueAt.toISOString(),
      priority: r.chore.priority as ChorePriority,
      status: r.chore.status as 'pending' | 'in_progress' | 'completed' | 'overdue',
      recurrenceRule: r.chore.recurrenceRule as ChoreRecurrence,
      completedAt: r.chore.completedAt ? r.chore.completedAt.toISOString() : null,
      createdAt: r.chore.createdAt.toISOString(),
      assignee: r.assignee
        ? {
            id: r.assignee.id,
            fullName: r.assignee.fullName,
            avatarUrl: r.assignee.avatarUrl,
            phone: r.assignee.phone,
            createdAt: r.assignee.createdAt.toISOString(),
            updatedAt: r.assignee.updatedAt.toISOString(),
          }
        : undefined,
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
    const db = requireDb();
    const [row] = await db
      .insert(schema.chores)
      .values({
        flatId,
        title: data.title,
        description: data.description ?? null,
        assignedTo: data.assignedTo ?? null,
        createdBy: creatorId,
        dueAt: new Date(data.dueAt),
        priority: data.priority ?? 'medium',
        status: 'pending',
        recurrenceRule: data.recurrenceRule ?? 'none',
      })
      .returning();

    let assignee: UserProfile | undefined;
    if (data.assignedTo) {
      const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, data.assignedTo)).limit(1);
      if (p) {
        assignee = {
          id: p.id,
          fullName: p.fullName,
          avatarUrl: p.avatarUrl,
          phone: p.phone,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }
    }

    return {
      id: row.id,
      flatId: row.flatId,
      title: row.title,
      description: row.description,
      assignedTo: row.assignedTo,
      createdBy: row.createdBy,
      dueAt: row.dueAt.toISOString(),
      priority: row.priority as ChorePriority,
      status: row.status as 'pending' | 'in_progress' | 'completed' | 'overdue',
      recurrenceRule: row.recurrenceRule as ChoreRecurrence,
      completedAt: null,
      createdAt: row.createdAt.toISOString(),
      assignee,
    };
  }

  async completeChore(choreId: string, userId: string): Promise<Chore | null> {
    const db = requireDb();
    return await db.transaction(async (tx) => {
      const [chore] = await tx
        .update(schema.chores)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(schema.chores.id, choreId))
        .returning();

      if (!chore) return null;

      await tx.insert(schema.choreHistory).values({
        choreId,
        userId,
        action: 'completed',
      });

      return {
        id: chore.id,
        flatId: chore.flatId,
        title: chore.title,
        description: chore.description,
        assignedTo: chore.assignedTo,
        createdBy: chore.createdBy,
        dueAt: chore.dueAt.toISOString(),
        priority: chore.priority as ChorePriority,
        status: 'completed',
        recurrenceRule: chore.recurrenceRule as ChoreRecurrence,
        completedAt: chore.completedAt?.toISOString() ?? null,
        createdAt: chore.createdAt.toISOString(),
      };
    });
  }

  async rotateChores(flatId: string): Promise<{ rotatedCount: number; chores: Chore[] }> {
    const db = requireDb();
    return await db.transaction(async (tx) => {
      const members = await tx
        .select()
        .from(schema.flatMembers)
        .where(and(eq(schema.flatMembers.flatId, flatId), eq(schema.flatMembers.status, 'active')));

      if (members.length === 0) return { rotatedCount: 0, chores: [] };

      const memberIds = members.map((m) => m.userId);
      const pendingChores = await tx
        .select()
        .from(schema.chores)
        .where(and(eq(schema.chores.flatId, flatId)));

      let rotatedCount = 0;
      for (const chore of pendingChores) {
        if (chore.assignedTo) {
          const curIdx = memberIds.indexOf(chore.assignedTo);
          const nextIdx = (curIdx + 1) % memberIds.length;
          const nextUserId = memberIds[nextIdx];

          await tx.update(schema.chores).set({ assignedTo: nextUserId }).where(eq(schema.chores.id, chore.id));
          rotatedCount++;
        }
      }

      const updated = await this.getChoresByFlat(flatId);
      return { rotatedCount, chores: updated };
    });
  }
}

export class PgGroceryRepository implements IGroceryRepository {
  async getOrCreateDefaultList(flatId: string, userId: string): Promise<GroceryList> {
    const db = requireDb();
    const [existing] = await db.select().from(schema.groceryLists).where(eq(schema.groceryLists.flatId, flatId)).limit(1);
    if (existing) {
      return {
        id: existing.id,
        flatId: existing.flatId,
        name: existing.name,
        createdBy: existing.createdBy,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    const [created] = await db
      .insert(schema.groceryLists)
      .values({
        flatId,
        name: 'Shared Kitchen Essentials',
        createdBy: userId,
      })
      .returning();

    return {
      id: created.id,
      flatId: created.flatId,
      name: created.name,
      createdBy: created.createdBy,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getGroceryItems(listId: string): Promise<GroceryItem[]> {
    const db = requireDb();
    const rows = await db
      .select({
        item: schema.groceryItems,
        addedBy: schema.profiles,
      })
      .from(schema.groceryItems)
      .innerJoin(schema.profiles, eq(schema.groceryItems.addedBy, schema.profiles.id))
      .where(eq(schema.groceryItems.listId, listId))
      .orderBy(desc(schema.groceryItems.createdAt));

    if (rows.length === 0) return [];

    const assignedIds = rows.map((r) => r.item.assignedTo).filter((id): id is string => Boolean(id));
    const assignedProfiles =
      assignedIds.length > 0 ? await db.select().from(schema.profiles).where(inArray(schema.profiles.id, assignedIds)) : [];
    const assignedMap = new Map(assignedProfiles.map((p) => [p.id, p]));

    return rows.map((r) => {
      const assigned = r.item.assignedTo ? assignedMap.get(r.item.assignedTo) : undefined;
      return {
        id: r.item.id,
        listId: r.item.listId,
        name: r.item.name,
        quantity: r.item.quantity,
        unit: r.item.unit,
        estimatedPricePaise: r.item.estimatedPricePaise,
        actualPricePaise: r.item.actualPricePaise,
        addedBy: r.item.addedBy,
        assignedTo: r.item.assignedTo,
        isPurchased: r.item.isPurchased,
        purchasedAt: r.item.purchasedAt ? r.item.purchasedAt.toISOString() : null,
        createdAt: r.item.createdAt.toISOString(),
        addedByUser: {
          id: r.addedBy.id,
          fullName: r.addedBy.fullName,
          avatarUrl: r.addedBy.avatarUrl,
          phone: r.addedBy.phone,
          createdAt: r.addedBy.createdAt.toISOString(),
          updatedAt: r.addedBy.updatedAt.toISOString(),
        },
        assignedUser: assigned
          ? {
              id: assigned.id,
              fullName: assigned.fullName,
              avatarUrl: assigned.avatarUrl,
              phone: assigned.phone,
              createdAt: assigned.createdAt.toISOString(),
              updatedAt: assigned.updatedAt.toISOString(),
            }
          : undefined,
      };
    });
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
    const db = requireDb();
    const [item] = await db
      .insert(schema.groceryItems)
      .values({
        listId,
        name: data.name,
        quantity: data.quantity ?? 1,
        unit: data.unit ?? 'units',
        estimatedPricePaise: data.estimatedPricePaise ?? 0,
        actualPricePaise: null,
        addedBy,
        assignedTo: data.assignedTo ?? null,
        isPurchased: false,
      })
      .returning();

    const [addedUser] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, addedBy)).limit(1);

    return {
      id: item.id,
      listId: item.listId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      estimatedPricePaise: item.estimatedPricePaise,
      actualPricePaise: null,
      addedBy: item.addedBy,
      assignedTo: item.assignedTo,
      isPurchased: false,
      purchasedAt: null,
      createdAt: item.createdAt.toISOString(),
      addedByUser: addedUser
        ? {
            id: addedUser.id,
            fullName: addedUser.fullName,
            avatarUrl: addedUser.avatarUrl,
            phone: addedUser.phone,
            createdAt: addedUser.createdAt.toISOString(),
            updatedAt: addedUser.updatedAt.toISOString(),
          }
        : undefined,
    };
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
    const db = requireDb();
    const [existing] = await db.select().from(schema.groceryItems).where(eq(schema.groceryItems.id, itemId)).limit(1);
    if (!existing) return null;

    let purchasedAt = existing.purchasedAt;
    if (patch.isPurchased && !existing.purchasedAt) {
      purchasedAt = new Date();
    } else if (patch.isPurchased === false) {
      purchasedAt = null;
    }

    const [updated] = await db
      .update(schema.groceryItems)
      .set({
        ...patch,
        purchasedAt,
      })
      .where(eq(schema.groceryItems.id, itemId))
      .returning();

    const [addedUser] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, updated.addedBy)).limit(1);

    return {
      id: updated.id,
      listId: updated.listId,
      name: updated.name,
      quantity: updated.quantity,
      unit: updated.unit,
      estimatedPricePaise: updated.estimatedPricePaise,
      actualPricePaise: updated.actualPricePaise,
      addedBy: updated.addedBy,
      assignedTo: updated.assignedTo,
      isPurchased: updated.isPurchased,
      purchasedAt: updated.purchasedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      addedByUser: addedUser
        ? {
            id: addedUser.id,
            fullName: addedUser.fullName,
            avatarUrl: addedUser.avatarUrl,
            phone: addedUser.phone,
            createdAt: addedUser.createdAt.toISOString(),
            updatedAt: addedUser.updatedAt.toISOString(),
          }
        : undefined,
    };
  }

  async deleteItem(itemId: string): Promise<boolean> {
    const db = requireDb();
    const result = await db.delete(schema.groceryItems).where(eq(schema.groceryItems.id, itemId));
    return (result.rowCount ?? 0) > 0;
  }
}

export class PgMaintenanceRepository implements IMaintenanceRepository {
  async getRequestsByFlat(flatId: string, status?: string): Promise<MaintenanceRequest[]> {
    const db = requireDb();
    const rows = await db
      .select({
        req: schema.maintenanceRequests,
        reporter: schema.profiles,
      })
      .from(schema.maintenanceRequests)
      .innerJoin(schema.profiles, eq(schema.maintenanceRequests.reportedBy, schema.profiles.id))
      .where(eq(schema.maintenanceRequests.flatId, flatId))
      .orderBy(desc(schema.maintenanceRequests.createdAt));

    let filtered = rows;
    if (status) filtered = filtered.filter((r) => r.req.status === status);

    if (filtered.length === 0) return [];

    const requestIds = filtered.map((r) => r.req.id);
    const commentsRows = await db
      .select({
        comment: schema.maintenanceComments,
        user: schema.profiles,
      })
      .from(schema.maintenanceComments)
      .innerJoin(schema.profiles, eq(schema.maintenanceComments.userId, schema.profiles.id))
      .where(inArray(schema.maintenanceComments.requestId, requestIds))
      .orderBy(asc(schema.maintenanceComments.createdAt));

    const commentsByReq = new Map<string, MaintenanceComment[]>();
    for (const c of commentsRows) {
      const arr = commentsByReq.get(c.comment.requestId) || [];
      arr.push({
        id: c.comment.id,
        requestId: c.comment.requestId,
        userId: c.comment.userId,
        comment: c.comment.comment,
        createdAt: c.comment.createdAt.toISOString(),
        user: {
          id: c.user.id,
          fullName: c.user.fullName,
          avatarUrl: c.user.avatarUrl,
          phone: c.user.phone,
          createdAt: c.user.createdAt.toISOString(),
          updatedAt: c.user.updatedAt.toISOString(),
        },
      });
      commentsByReq.set(c.comment.requestId, arr);
    }

    return filtered.map((r) => ({
      id: r.req.id,
      flatId: r.req.flatId,
      title: r.req.title,
      description: r.req.description,
      location: r.req.location,
      priority: r.req.priority as MaintenancePriority,
      status: r.req.status as 'open' | 'in_progress' | 'resolved' | 'cancelled',
      reportedBy: r.req.reportedBy,
      assignedTo: r.req.assignedTo,
      imagePath: r.req.imagePath,
      createdAt: r.req.createdAt.toISOString(),
      updatedAt: r.req.updatedAt.toISOString(),
      resolvedAt: r.req.resolvedAt ? r.req.resolvedAt.toISOString() : null,
      comments: commentsByReq.get(r.req.id) || [],
      reporter: {
        id: r.reporter.id,
        fullName: r.reporter.fullName,
        avatarUrl: r.reporter.avatarUrl,
        phone: r.reporter.phone,
        createdAt: r.reporter.createdAt.toISOString(),
        updatedAt: r.reporter.updatedAt.toISOString(),
      },
    }));
  }

  async getRequestById(requestId: string): Promise<MaintenanceRequest | null> {
    const list = await this.getRequestsByFlat('');
    return list.find((r) => r.id === requestId) ?? null;
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
    const db = requireDb();
    const [req] = await db
      .insert(schema.maintenanceRequests)
      .values({
        flatId,
        reportedBy: reporterId,
        title: data.title,
        description: data.description,
        location: data.location,
        priority: data.priority ?? 'medium',
        status: 'open',
        assignedTo: data.assignedTo ?? null,
        imagePath: data.imagePath ?? null,
      })
      .returning();

    const [reporter] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, reporterId)).limit(1);

    return {
      id: req.id,
      flatId: req.flatId,
      title: req.title,
      description: req.description,
      location: req.location,
      priority: req.priority as MaintenancePriority,
      status: 'open',
      reportedBy: req.reportedBy,
      assignedTo: req.assignedTo,
      imagePath: req.imagePath,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      resolvedAt: null,
      comments: [],
      reporter: reporter
        ? {
            id: reporter.id,
            fullName: reporter.fullName,
            avatarUrl: reporter.avatarUrl,
            phone: reporter.phone,
            createdAt: reporter.createdAt.toISOString(),
            updatedAt: reporter.updatedAt.toISOString(),
          }
        : undefined,
    };
  }

  async updateStatus(
    requestId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'cancelled'
  ): Promise<MaintenanceRequest | null> {
    const db = requireDb();
    const [updated] = await db
      .update(schema.maintenanceRequests)
      .set({
        status,
        updatedAt: new Date(),
        resolvedAt: status === 'resolved' ? new Date() : null,
      })
      .where(eq(schema.maintenanceRequests.id, requestId))
      .returning();

    if (!updated) return null;
    return {
      id: updated.id,
      flatId: updated.flatId,
      title: updated.title,
      description: updated.description,
      location: updated.location,
      priority: updated.priority as MaintenancePriority,
      status: updated.status as 'open' | 'in_progress' | 'resolved' | 'cancelled',
      reportedBy: updated.reportedBy,
      assignedTo: updated.assignedTo,
      imagePath: updated.imagePath,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      resolvedAt: updated.resolvedAt ? updated.resolvedAt.toISOString() : null,
      comments: [],
    };
  }

  async addComment(requestId: string, userId: string, commentText: string): Promise<MaintenanceComment> {
    const db = requireDb();
    const [row] = await db
      .insert(schema.maintenanceComments)
      .values({
        requestId,
        userId,
        comment: commentText,
      })
      .returning();

    const [u] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, userId)).limit(1);

    return {
      id: row.id,
      requestId: row.requestId,
      userId: row.userId,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      user: u
        ? {
            id: u.id,
            fullName: u.fullName,
            avatarUrl: u.avatarUrl,
            phone: u.phone,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
          }
        : undefined,
    };
  }
}

export class PgVisitorRepository implements IVisitorRepository {
  async getVisitorsByFlat(flatId: string): Promise<Visitor[]> {
    const db = requireDb();
    const rows = await db
      .select({
        visitor: schema.visitors,
        host: schema.profiles,
      })
      .from(schema.visitors)
      .innerJoin(schema.profiles, eq(schema.visitors.hostId, schema.profiles.id))
      .where(eq(schema.visitors.flatId, flatId))
      .orderBy(desc(schema.visitors.expectedArrival));

    return rows.map((r) => ({
      id: r.visitor.id,
      flatId: r.visitor.flatId,
      visitorName: r.visitor.visitorName,
      hostId: r.visitor.hostId,
      purpose: r.visitor.purpose,
      expectedArrival: r.visitor.expectedArrival.toISOString(),
      expectedDeparture: r.visitor.expectedDeparture.toISOString(),
      checkedInAt: r.visitor.checkedInAt ? r.visitor.checkedInAt.toISOString() : null,
      checkedOutAt: r.visitor.checkedOutAt ? r.visitor.checkedOutAt.toISOString() : null,
      notes: r.visitor.notes,
      createdAt: r.visitor.createdAt.toISOString(),
      host: {
        id: r.host.id,
        fullName: r.host.fullName,
        avatarUrl: r.host.avatarUrl,
        phone: r.host.phone,
        createdAt: r.host.createdAt.toISOString(),
        updatedAt: r.host.updatedAt.toISOString(),
      },
    }));
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
    const db = requireDb();
    const [row] = await db
      .insert(schema.visitors)
      .values({
        flatId,
        visitorName: data.visitorName,
        hostId: data.hostId,
        purpose: data.purpose,
        expectedArrival: new Date(data.expectedArrival),
        expectedDeparture: new Date(data.expectedDeparture),
        notes: data.notes ?? null,
      })
      .returning();

    const [h] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, data.hostId)).limit(1);

    return {
      id: row.id,
      flatId: row.flatId,
      visitorName: row.visitorName,
      hostId: row.hostId,
      purpose: row.purpose,
      expectedArrival: row.expectedArrival.toISOString(),
      expectedDeparture: row.expectedDeparture.toISOString(),
      checkedInAt: null,
      checkedOutAt: null,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      host: h
        ? {
            id: h.id,
            fullName: h.fullName,
            avatarUrl: h.avatarUrl,
            phone: h.phone,
            createdAt: h.createdAt.toISOString(),
            updatedAt: h.updatedAt.toISOString(),
          }
        : undefined,
    };
  }

  async checkInVisitor(visitorId: string): Promise<Visitor | null> {
    const db = requireDb();
    const [row] = await db
      .update(schema.visitors)
      .set({ checkedInAt: new Date() })
      .where(eq(schema.visitors.id, visitorId))
      .returning();

    if (!row) return null;
    return {
      id: row.id,
      flatId: row.flatId,
      visitorName: row.visitorName,
      hostId: row.hostId,
      purpose: row.purpose,
      expectedArrival: row.expectedArrival.toISOString(),
      expectedDeparture: row.expectedDeparture.toISOString(),
      checkedInAt: row.checkedInAt?.toISOString() ?? null,
      checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async checkOutVisitor(visitorId: string): Promise<Visitor | null> {
    const db = requireDb();
    const [row] = await db
      .update(schema.visitors)
      .set({ checkedOutAt: new Date() })
      .where(eq(schema.visitors.id, visitorId))
      .returning();

    if (!row) return null;
    return {
      id: row.id,
      flatId: row.flatId,
      visitorName: row.visitorName,
      hostId: row.hostId,
      purpose: row.purpose,
      expectedArrival: row.expectedArrival.toISOString(),
      expectedDeparture: row.expectedDeparture.toISOString(),
      checkedInAt: row.checkedInAt?.toISOString() ?? null,
      checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

export class PgAnnouncementRepository implements IAnnouncementRepository {
  async getAnnouncementsByFlat(flatId: string, _userId: string): Promise<Announcement[]> {
    const db = requireDb();
    const rows = await db
      .select({
        ann: schema.announcements,
        author: schema.profiles,
      })
      .from(schema.announcements)
      .innerJoin(schema.profiles, eq(schema.announcements.authorId, schema.profiles.id))
      .where(eq(schema.announcements.flatId, flatId))
      .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.createdAt));

    return rows.map((r) => ({
      id: r.ann.id,
      flatId: r.ann.flatId,
      authorId: r.ann.authorId,
      title: r.ann.title,
      content: r.ann.content,
      isPinned: r.ann.isPinned,
      createdAt: r.ann.createdAt.toISOString(),
      updatedAt: r.ann.updatedAt.toISOString(),
      readByCount: 0,
      author: {
        id: r.author.id,
        fullName: r.author.fullName,
        avatarUrl: r.author.avatarUrl,
        phone: r.author.phone,
        createdAt: r.author.createdAt.toISOString(),
        updatedAt: r.author.updatedAt.toISOString(),
      },
    }));
  }

  async createAnnouncement(
    flatId: string,
    authorId: string,
    data: { title: string; content: string; isPinned?: boolean }
  ): Promise<Announcement> {
    const db = requireDb();
    const [row] = await db
      .insert(schema.announcements)
      .values({
        flatId,
        authorId,
        title: data.title,
        content: data.content,
        isPinned: data.isPinned ?? false,
      })
      .returning();

    const [author] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, authorId)).limit(1);

    return {
      id: row.id,
      flatId: row.flatId,
      authorId: row.authorId,
      title: row.title,
      content: row.content,
      isPinned: row.isPinned,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      readByCount: 0,
      author: author
        ? {
            id: author.id,
            fullName: author.fullName,
            avatarUrl: author.avatarUrl,
            phone: author.phone,
            createdAt: author.createdAt.toISOString(),
            updatedAt: author.updatedAt.toISOString(),
          }
        : undefined,
    };
  }

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    const db = requireDb();
    await db
      .insert(schema.announcementReads)
      .values({ announcementId, userId })
      .onConflictDoNothing();
  }
}

export class PgEventRepository implements IEventRepository {
  async getEventsByFlat(flatId: string, _startIso?: string, _endIso?: string): Promise<CalendarEvent[]> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.flatId, flatId))
      .orderBy(asc(schema.events.startAt));

    return rows.map((r) => ({
      id: r.id,
      flatId: r.flatId,
      title: r.title,
      description: r.description,
      eventType: r.eventType as EventType,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      createdBy: r.createdBy,
      linkedRecordType: r.linkedRecordType,
      linkedRecordId: r.linkedRecordId,
      createdAt: r.createdAt.toISOString(),
    }));
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
    const db = requireDb();
    const [row] = await db
      .insert(schema.events)
      .values({
        flatId,
        title: data.title,
        description: data.description ?? null,
        eventType: (data.eventType ?? 'social') as EventType,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        createdBy: creatorId,
        linkedRecordType: data.linkedRecordType ?? null,
        linkedRecordId: data.linkedRecordId ?? null,
      })
      .returning();

    return {
      id: row.id,
      flatId: row.flatId,
      title: row.title,
      description: row.description,
      eventType: row.eventType as EventType,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      createdBy: row.createdBy,
      linkedRecordType: row.linkedRecordType,
      linkedRecordId: row.linkedRecordId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

export class PgActivityRepository implements IActivityRepository {
  async getLogsByFlat(flatId: string, limit = 20): Promise<ActivityLog[]> {
    const db = requireDb();
    const rows = await db
      .select({
        log: schema.activityLogs,
        actor: schema.profiles,
      })
      .from(schema.activityLogs)
      .innerJoin(schema.profiles, eq(schema.activityLogs.actorId, schema.profiles.id))
      .where(eq(schema.activityLogs.flatId, flatId))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.log.id,
      flatId: r.log.flatId,
      actorId: r.log.actorId,
      action: r.log.action,
      entityType: r.log.entityType,
      entityId: r.log.entityId,
      previousValues: r.log.previousValues ? JSON.parse(r.log.previousValues) : null,
      newValues: r.log.newValues ? JSON.parse(r.log.newValues) : null,
      createdAt: r.log.createdAt.toISOString(),
      actor: {
        id: r.actor.id,
        fullName: r.actor.fullName,
        avatarUrl: r.actor.avatarUrl,
        phone: r.actor.phone,
        createdAt: r.actor.createdAt.toISOString(),
        updatedAt: r.actor.updatedAt.toISOString(),
      },
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
    const db = requireDb();
    await db.insert(schema.activityLogs).values({
      flatId: log.flatId,
      actorId: log.actorId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      previousValues: log.previousValues ? JSON.stringify(log.previousValues) : null,
      newValues: log.newValues ? JSON.stringify(log.newValues) : null,
    });
  }
}

export function createPgRepositories(): IRepositories {
  return {
    flats: new PgFlatRepository(),
    profiles: new PgProfileRepository(),
    expenses: new PgExpenseRepository(),
    settlements: new PgSettlementRepository(),
    bills: new PgBillRepository(),
    chores: new PgChoreRepository(),
    groceries: new PgGroceryRepository(),
    maintenance: new PgMaintenanceRepository(),
    visitors: new PgVisitorRepository(),
    announcements: new PgAnnouncementRepository(),
    events: new PgEventRepository(),
    activity: new PgActivityRepository(),
  };
}
