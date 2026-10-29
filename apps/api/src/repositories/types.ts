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
} from '@flatflow/shared';
import type { FlatCreationRequest as FlatRequest } from './store.js';

export interface FlatMemberWithProfile {
  id: string;
  flatId: string;
  userId: string;
  role: MemberRole;
  status: 'active' | 'invited' | 'left';
  joinedAt: string;
  profile: UserProfile;
}

export interface UserFlatSummary extends Flat {
  role: MemberRole;
  joinedAt: string;
}

export interface BalanceSummary {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  user: UserProfile;
  totalPaidPaise: number;
  totalOwedPaise: number;
  netBalancePaise: number;
}

export interface SuggestedSettlement {
  fromUserId: string;
  fromName: string;
  fromUser: UserProfile;
  toUserId: string;
  toName: string;
  toUser: UserProfile;
  amountPaise: number;
}

export interface IFlatRepository {
  getUserFlats(userId: string): Promise<UserFlatSummary[]>;
  getFlatById(flatId: string): Promise<Flat | null>;
  createFlat(flat: { name: string; addressLabel?: string | null; currency?: string; createdBy: string }): Promise<Flat>;
  getFlatMembers(flatId: string): Promise<FlatMemberWithProfile[]>;
  getFlatMember(flatId: string, userId: string): Promise<FlatMemberWithProfile | null>;
  addMember(data: { flatId: string; userId: string; role: MemberRole; status?: 'active' | 'invited' }): Promise<FlatMemberWithProfile>;
  updateMemberRole(flatId: string, memberId: string, role: MemberRole): Promise<FlatMemberWithProfile | null>;
  removeMember(flatId: string, memberId: string): Promise<boolean>;
  getInviteByCode(code: string): Promise<{ id: string; flatId: string; code: string; expiresAt: string; maxUses: number; useCount: number } | null>;
  createInvite(flatId: string, invitedBy: string): Promise<{ id: string; flatId: string; code: string }>;
  useInvite(inviteId: string): Promise<void>;
  getPendingFlatRequests(): Promise<FlatRequest[]>;
  createFlatRequest(data: { name: string; addressLabel?: string; currency?: string; requestedBy: string; requesterName: string }): Promise<FlatRequest>;
  approveFlatRequest(requestId: string, adminId: string): Promise<{ request: FlatRequest; flat: Flat }>;
  rejectFlatRequest(requestId: string, adminId: string): Promise<FlatRequest>;
}

export interface IProfileRepository {
  getProfileById(id: string): Promise<UserProfile | null>;
  upsertProfile(profile: Partial<UserProfile> & { id: string; fullName: string }): Promise<UserProfile>;
  getProfilesByIds(ids: string[]): Promise<Map<string, UserProfile>>;
}

export interface IExpenseRepository {
  getExpensesByFlat(
    flatId: string,
    filters?: { category?: string; payerId?: string; search?: string }
  ): Promise<Expense[]>;
  getExpenseById(expenseId: string): Promise<Expense | null>;
  createExpense(
    flatId: string,
    creatorId: string,
    input: CreateExpenseInput
  ): Promise<Expense>;
  deleteExpense(expenseId: string, flatId: string, actorId: string): Promise<boolean>;
}

export interface ISettlementRepository {
  getSettlementsByFlat(flatId: string): Promise<Settlement[]>;
  createSettlement(
    flatId: string,
    actorId: string,
    data: { payerId: string; receiverId: string; amountPaise: number }
  ): Promise<Settlement>;
  calculateBalances(flatId: string): Promise<{
    balances: BalanceSummary[];
    suggestedSettlements: SuggestedSettlement[];
  }>;
}

export interface IBillRepository {
  getBillsByFlat(flatId: string, status?: string): Promise<Bill[]>;
  getBillById(billId: string): Promise<Bill | null>;
  createBill(
    flatId: string,
    creatorId: string,
    input: CreateBillInput & { shares: Array<{ userId: string; sharePaise: number }> }
  ): Promise<Bill>;
  recordSharePayment(
    flatId: string,
    billId: string,
    shareId: string,
    amountPaise: number
  ): Promise<BillShare | null>;
}

export interface IChoreRepository {
  getChoresByFlat(flatId: string): Promise<Chore[]>;
  getChoreById(choreId: string): Promise<Chore | null>;
  createChore(
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
  ): Promise<Chore>;
  completeChore(choreId: string, userId: string): Promise<Chore | null>;
  rotateChores(flatId: string): Promise<{ rotatedCount: number; chores: Chore[] }>;
}

export interface IGroceryRepository {
  getOrCreateDefaultList(flatId: string, userId: string): Promise<GroceryList>;
  getGroceryItems(listId: string): Promise<GroceryItem[]>;
  addItem(
    listId: string,
    addedBy: string,
    data: {
      name: string;
      quantity?: number;
      unit?: string;
      estimatedPricePaise?: number;
      assignedTo?: string | null;
    }
  ): Promise<GroceryItem>;
  updateItem(
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
  ): Promise<GroceryItem | null>;
  deleteItem(itemId: string): Promise<boolean>;
}

export interface IMaintenanceRepository {
  getRequestsByFlat(flatId: string, status?: string): Promise<MaintenanceRequest[]>;
  getRequestById(requestId: string): Promise<MaintenanceRequest | null>;
  createRequest(
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
  ): Promise<MaintenanceRequest>;
  updateStatus(
    requestId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'cancelled'
  ): Promise<MaintenanceRequest | null>;
  addComment(
    requestId: string,
    userId: string,
    comment: string
  ): Promise<MaintenanceComment>;
}

export interface IVisitorRepository {
  getVisitorsByFlat(flatId: string): Promise<Visitor[]>;
  createVisitor(
    flatId: string,
    data: {
      visitorName: string;
      hostId: string;
      purpose: string;
      expectedArrival: string;
      expectedDeparture: string;
      notes?: string | null;
    }
  ): Promise<Visitor>;
  checkInVisitor(visitorId: string): Promise<Visitor | null>;
  checkOutVisitor(visitorId: string): Promise<Visitor | null>;
}

export interface IAnnouncementRepository {
  getAnnouncementsByFlat(flatId: string, userId: string): Promise<Announcement[]>;
  createAnnouncement(
    flatId: string,
    authorId: string,
    data: { title: string; content: string; isPinned?: boolean }
  ): Promise<Announcement>;
  markAsRead(announcementId: string, userId: string): Promise<void>;
}

export interface IEventRepository {
  getEventsByFlat(flatId: string, startIso?: string, endIso?: string): Promise<CalendarEvent[]>;
  createEvent(
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
  ): Promise<CalendarEvent>;
}

export interface IActivityRepository {
  getLogsByFlat(flatId: string, limit?: number): Promise<ActivityLog[]>;
  logActivity(log: {
    flatId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValues?: unknown;
    newValues?: unknown;
  }): Promise<void>;
}

export interface IRepositories {
  flats: IFlatRepository;
  profiles: IProfileRepository;
  expenses: IExpenseRepository;
  settlements: ISettlementRepository;
  bills: IBillRepository;
  chores: IChoreRepository;
  groceries: IGroceryRepository;
  maintenance: IMaintenanceRepository;
  visitors: IVisitorRepository;
  announcements: IAnnouncementRepository;
  events: IEventRepository;
  activity: IActivityRepository;
}
