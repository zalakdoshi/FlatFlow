export const MEMBER_ROLES = ['owner', 'admin', 'member'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const SPLIT_TYPES = ['equal', 'exact', 'percentage', 'shares'] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

export const EXPENSE_CATEGORIES = [
  'groceries',
  'rent',
  'utilities',
  'household_supplies',
  'food_dining',
  'maintenance',
  'entertainment',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const BILL_CATEGORIES = [
  'rent',
  'electricity',
  'water',
  'wifi',
  'gas',
  'maid',
  'maintenance',
  'other',
] as const;
export type BillCategory = (typeof BILL_CATEGORIES)[number];

export const BILL_STATUSES = ['pending', 'partially_paid', 'paid', 'overdue'] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const CHORE_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type ChorePriority = (typeof CHORE_PRIORITIES)[number];

export const CHORE_STATUSES = ['pending', 'in_progress', 'completed', 'overdue'] as const;
export type ChoreStatus = (typeof CHORE_STATUSES)[number];

export const CHORE_RECURRENCES = ['none', 'daily', 'weekly', 'biweekly', 'monthly'] as const;
export type ChoreRecurrence = (typeof CHORE_RECURRENCES)[number];

export const MAINTENANCE_PRIORITIES = ['low', 'medium', 'high', 'emergency'] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export const MAINTENANCE_STATUSES = ['open', 'in_progress', 'resolved', 'cancelled'] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const EVENT_TYPES = ['chore', 'bill', 'visitor', 'maintenance', 'social', 'house_meeting', 'other'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const NOTIFICATION_TYPES = [
  'expense_created',
  'expense_settled',
  'bill_due',
  'chore_assigned',
  'chore_completed',
  'grocery_added',
  'maintenance_update',
  'announcement_posted',
  'visitor_expected',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
