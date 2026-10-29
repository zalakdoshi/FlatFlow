import type {
  MemberRole,
  SplitType,
  ExpenseCategory,
  BillCategory,
  BillStatus,
  ChorePriority,
  ChoreStatus,
  ChoreRecurrence,
  MaintenancePriority,
  MaintenanceStatus,
  EventType,
  NotificationType,
} from './constants.js';

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Flat {
  id: string;
  name: string;
  addressLabel: string | null;
  currency: string;
  createdBy: string;
  createdAt: string;
}

export interface FlatMember {
  id: string;
  flatId: string;
  userId: string;
  role: MemberRole;
  status: 'active' | 'invited' | 'left';
  joinedAt: string;
  profile?: UserProfile;
}

export interface FlatInvite {
  id: string;
  flatId: string;
  tokenHash: string;
  code: string;
  invitedBy: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  createdAt: string;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  sharePaise: number;
  user?: UserProfile;
}

export interface Expense {
  id: string;
  flatId: string;
  payerId: string;
  description: string;
  category: ExpenseCategory;
  amountPaise: number;
  expenseDate: string;
  receiptPath: string | null;
  createdAt: string;
  updatedAt: string;
  payer?: UserProfile;
  splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  flatId: string;
  payerId: string;
  receiverId: string;
  amountPaise: number;
  status: 'pending' | 'completed' | 'cancelled';
  settledAt: string | null;
  createdAt: string;
  payer?: UserProfile;
  receiver?: UserProfile;
}

export interface SuggestedSettlement {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amountPaise: number;
}

export interface MemberBalance {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  totalPaidPaise: number;
  totalOwedPaise: number;
  netBalancePaise: number; // positive = owed money, negative = owes money
}

export interface BillShare {
  id: string;
  billId: string;
  userId: string;
  sharePaise: number;
  paidAmountPaise: number;
  status: 'pending' | 'paid';
  user?: UserProfile;
}

export interface Bill {
  id: string;
  flatId: string;
  title: string;
  category: BillCategory;
  totalAmountPaise: number;
  dueDate: string;
  billingPeriod: string;
  status: BillStatus;
  createdBy: string;
  createdAt: string;
  shares: BillShare[];
}

export interface Chore {
  id: string;
  flatId: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  createdBy: string;
  dueAt: string;
  priority: ChorePriority;
  status: ChoreStatus;
  recurrenceRule: ChoreRecurrence;
  completedAt: string | null;
  createdAt: string;
  assignee?: UserProfile;
}

export interface ChoreHistory {
  id: string;
  choreId: string;
  userId: string;
  action: 'created' | 'assigned' | 'completed' | 'reopened';
  createdAt: string;
  user?: UserProfile;
}

export interface GroceryList {
  id: string;
  flatId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  itemsCount?: number;
}

export interface GroceryItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedPricePaise: number;
  actualPricePaise: number | null;
  addedBy: string;
  assignedTo: string | null;
  isPurchased: boolean;
  purchasedAt: string | null;
  createdAt: string;
  addedByUser?: UserProfile;
  assignedUser?: UserProfile;
}

export interface MaintenanceComment {
  id: string;
  requestId: string;
  userId: string;
  comment: string;
  createdAt: string;
  user?: UserProfile;
}

export interface MaintenanceRequest {
  id: string;
  flatId: string;
  title: string;
  description: string;
  location: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedBy: string;
  assignedTo: string | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reporter?: UserProfile;
  assignee?: UserProfile;
  comments?: MaintenanceComment[];
}

export interface Visitor {
  id: string;
  flatId: string;
  visitorName: string;
  hostId: string;
  purpose: string;
  expectedArrival: string;
  expectedDeparture: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  notes: string | null;
  createdAt: string;
  host?: UserProfile;
}

export interface Announcement {
  id: string;
  flatId: string;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author?: UserProfile;
  readByCount?: number;
  hasRead?: boolean;
}

export interface CalendarEvent {
  id: string;
  flatId: string;
  title: string;
  description: string | null;
  eventType: EventType;
  startAt: string;
  endAt: string;
  createdBy: string;
  linkedRecordType: string | null;
  linkedRecordId: string | null;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  flatId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkedRecordType: string | null;
  linkedRecordId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  flatId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
  actor?: UserProfile;
}

export interface DashboardSummary {
  flat: Flat;
  monthlyTotalSpendingPaise: number;
  userNetBalancePaise: number;
  pendingChoresCount: number;
  upcomingBillsCount: number;
  groceryPendingCount: number;
  activeVisitorsCount: number;
  openMaintenanceCount: number;
  members: FlatMember[];
  suggestedSettlements: SuggestedSettlement[];
  recentActivities: ActivityLog[];
  categorySpending: Array<{ category: ExpenseCategory; amountPaise: number }>;
}
