import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. User Profiles (linked to auth.users in Supabase)
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    avatarUrl: text('avatar_url'),
    phone: varchar('phone', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// 2. Flats
export const flats = pgTable(
  'flats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    addressLabel: varchar('address_label', { length: 255 }),
    currency: varchar('currency', { length: 10 }).default('INR').notNull(),
    createdBy: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// 3. Flat Memberships
export const flatMembers = pgTable(
  'flat_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).default('member').notNull(), // 'owner' | 'admin' | 'member'
    status: varchar('status', { length: 20 }).default('active').notNull(), // 'active' | 'invited' | 'left'
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('unique_flat_member_idx').on(table.flatId, table.userId),
    index('flat_member_flat_idx').on(table.flatId),
    index('flat_member_user_idx').on(table.userId),
  ]
);

// 4. Flat Invites
export const flatInvites = pgTable(
  'flat_invites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    code: varchar('code', { length: 32 }).notNull().unique(),
    invitedBy: uuid('invited_by').notNull().references(() => profiles.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    maxUses: integer('max_uses').default(10).notNull(),
    useCount: integer('use_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('invite_flat_idx').on(table.flatId),
    index('invite_code_idx').on(table.code),
  ]
);

// 5. Expenses
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    payerId: uuid('payer_id').notNull().references(() => profiles.id),
    description: varchar('description', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).default('other').notNull(),
    amountPaise: integer('amount_paise').notNull(),
    expenseDate: varchar('expense_date', { length: 12 }).notNull(),
    receiptPath: text('receipt_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('expenses_flat_idx').on(table.flatId),
    index('expenses_payer_idx').on(table.payerId),
    index('expenses_date_idx').on(table.expenseDate),
  ]
);

// 6. Expense Splits
export const expenseSplits = pgTable(
  'expense_splits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    expenseId: uuid('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    sharePaise: integer('share_paise').notNull(),
  },
  (table) => [
    index('splits_expense_idx').on(table.expenseId),
    index('splits_user_idx').on(table.userId),
  ]
);

// 7. Settlements
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    payerId: uuid('payer_id').notNull().references(() => profiles.id),
    receiverId: uuid('receiver_id').notNull().references(() => profiles.id),
    amountPaise: integer('amount_paise').notNull(),
    status: varchar('status', { length: 20 }).default('completed').notNull(), // 'pending' | 'completed' | 'cancelled'
    settledAt: timestamp('settled_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('settlements_flat_idx').on(table.flatId),
    index('settlements_payer_idx').on(table.payerId),
    index('settlements_receiver_idx').on(table.receiverId),
  ]
);

// 8. Bills
export const bills = pgTable(
  'bills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 150 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    totalAmountPaise: integer('total_amount_paise').notNull(),
    dueDate: varchar('due_date', { length: 12 }).notNull(),
    billingPeriod: varchar('billing_period', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'partially_paid' | 'paid' | 'overdue'
    createdBy: uuid('created_by').notNull().references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bills_flat_idx').on(table.flatId),
    index('bills_due_date_idx').on(table.dueDate),
    index('bills_status_idx').on(table.status),
  ]
);

// 9. Bill Shares
export const billShares = pgTable(
  'bill_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    billId: uuid('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    sharePaise: integer('share_paise').notNull(),
    paidAmountPaise: integer('paid_amount_paise').default(0).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
  },
  (table) => [
    index('bill_shares_bill_idx').on(table.billId),
    index('bill_shares_user_idx').on(table.userId),
  ]
);

// 10. Chores
export const chores = pgTable(
  'chores',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 150 }).notNull(),
    description: text('description'),
    assignedTo: uuid('assigned_to').references(() => profiles.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').notNull().references(() => profiles.id),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    priority: varchar('priority', { length: 20 }).default('medium').notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'in_progress' | 'completed' | 'overdue'
    recurrenceRule: varchar('recurrence_rule', { length: 20 }).default('none').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('chores_flat_idx').on(table.flatId),
    index('chores_assigned_idx').on(table.assignedTo),
    index('chores_due_idx').on(table.dueAt),
    index('chores_status_idx').on(table.status),
  ]
);

// 11. Chore History
export const choreHistory = pgTable(
  'chore_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    choreId: uuid('chore_id').notNull().references(() => chores.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    action: varchar('action', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('chore_history_chore_idx').on(table.choreId),
  ]
);

// 12. Grocery Lists
export const groceryLists = pgTable(
  'grocery_lists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).default('Household Groceries').notNull(),
    createdBy: uuid('created_by').notNull().references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('grocery_lists_flat_idx').on(table.flatId),
  ]
);

// 13. Grocery Items
export const groceryItems = pgTable(
  'grocery_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listId: uuid('list_id').notNull().references(() => groceryLists.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    quantity: integer('quantity').default(1).notNull(),
    unit: varchar('unit', { length: 30 }).default('units').notNull(),
    estimatedPricePaise: integer('estimated_price_paise').default(0).notNull(),
    actualPricePaise: integer('actual_price_paise'),
    addedBy: uuid('added_by').notNull().references(() => profiles.id),
    assignedTo: uuid('assigned_to').references(() => profiles.id, { onDelete: 'set null' }),
    isPurchased: boolean('is_purchased').default(false).notNull(),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('grocery_items_list_idx').on(table.listId),
    index('grocery_items_purchased_idx').on(table.isPurchased),
  ]
);

// 14. Maintenance Requests
export const maintenanceRequests = pgTable(
  'maintenance_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 150 }).notNull(),
    description: text('description').notNull(),
    location: varchar('location', { length: 100 }).notNull(),
    priority: varchar('priority', { length: 20 }).default('medium').notNull(),
    status: varchar('status', { length: 20 }).default('open').notNull(), // 'open' | 'in_progress' | 'resolved' | 'cancelled'
    reportedBy: uuid('reported_by').notNull().references(() => profiles.id),
    assignedTo: uuid('assigned_to').references(() => profiles.id, { onDelete: 'set null' }),
    imagePath: text('image_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [
    index('maintenance_flat_idx').on(table.flatId),
    index('maintenance_status_idx').on(table.status),
  ]
);

// 15. Maintenance Comments
export const maintenanceComments = pgTable(
  'maintenance_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requestId: uuid('request_id').notNull().references(() => maintenanceRequests.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('maintenance_comments_req_idx').on(table.requestId),
  ]
);

// 16. Visitors
export const visitors = pgTable(
  'visitors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    visitorName: varchar('visitor_name', { length: 100 }).notNull(),
    hostId: uuid('host_id').notNull().references(() => profiles.id),
    purpose: varchar('purpose', { length: 150 }).notNull(),
    expectedArrival: timestamp('expected_arrival', { withTimezone: true }).notNull(),
    expectedDeparture: timestamp('expected_departure', { withTimezone: true }).notNull(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    checkedOutAt: timestamp('checked_out_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('visitors_flat_idx').on(table.flatId),
    index('visitors_host_idx').on(table.hostId),
  ]
);

// 17. Announcements
export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull().references(() => profiles.id),
    title: varchar('title', { length: 150 }).notNull(),
    content: text('content').notNull(),
    isPinned: boolean('is_pinned').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('announcements_flat_idx').on(table.flatId),
    index('announcements_pinned_idx').on(table.isPinned),
  ]
);

// 18. Announcement Reads
export const announcementReads = pgTable(
  'announcement_reads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    announcementId: uuid('announcement_id').notNull().references(() => announcements.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    readAt: timestamp('read_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('unique_announcement_read_idx').on(table.announcementId, table.userId),
  ]
);

// 19. Calendar Events
export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 150 }).notNull(),
    description: text('description'),
    eventType: varchar('event_type', { length: 30 }).default('social').notNull(),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    createdBy: uuid('created_by').notNull().references(() => profiles.id),
    linkedRecordType: varchar('linked_record_type', { length: 50 }),
    linkedRecordId: uuid('linked_record_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('events_flat_idx').on(table.flatId),
    index('events_start_idx').on(table.startAt),
  ]
);

// 20. Notifications
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    recipientId: uuid('recipient_id').notNull().references(() => profiles.id),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 150 }).notNull(),
    message: text('message').notNull(),
    linkedRecordType: varchar('linked_record_type', { length: 50 }),
    linkedRecordId: uuid('linked_record_id'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('notifications_recipient_idx').on(table.recipientId),
    index('notifications_read_idx').on(table.readAt),
  ]
);

// 21. Activity Logs
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').notNull().references(() => profiles.id),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    previousValues: text('previous_values'), // JSON stringified
    newValues: text('new_values'),           // JSON stringified
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('activity_logs_flat_idx').on(table.flatId),
    index('activity_logs_created_idx').on(table.createdAt),
  ]
);

// 22. Flat Creation Requests (Roommate flat registration pending Admin review)
export const flatRequests = pgTable(
  'flat_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    addressLabel: varchar('address_label', { length: 255 }),
    currency: varchar('currency', { length: 10 }).default('INR').notNull(),
    requestedBy: uuid('requested_by').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    requesterName: varchar('requester_name', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
  },
  (table) => [
    index('flat_requests_status_idx').on(table.status),
    index('flat_requests_requester_idx').on(table.requestedBy),
  ]
);

