import { z } from 'zod';
import {
  MEMBER_ROLES,
  SPLIT_TYPES,
  EXPENSE_CATEGORIES,
  BILL_CATEGORIES,
  CHORE_PRIORITIES,
  CHORE_RECURRENCES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  EVENT_TYPES,
} from './constants.js';

// Authentication schemas
export const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Flat schemas
export const createFlatSchema = z.object({
  name: z.string().min(2, 'Flat name must be at least 2 characters').max(60),
  addressLabel: z.string().max(120).optional(),
  currency: z.string().default('INR'),
});

export type CreateFlatInput = z.infer<typeof createFlatSchema>;

export const joinFlatSchema = z.object({
  code: z.string().min(4, 'Invitation code is required').trim(),
});

export type JoinFlatInput = z.infer<typeof joinFlatSchema>;

export const createInviteSchema = z.object({
  maxUses: z.number().int().min(1).default(10),
  expiresInDays: z.number().int().min(1).max(90).default(7),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

// Expense schemas
export const expenseSplitInputSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  sharePaise: z.number().int().positive('Share must be positive'),
});

export const createExpenseSchema = z
  .object({
    description: z.string().min(2, 'Description must be at least 2 characters').max(120),
    category: z.enum(EXPENSE_CATEGORIES),
    amountPaise: z.number().int().positive('Amount must be greater than zero'),
    expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be YYYY-MM-DD format'),
    payerId: z.string().uuid('Invalid payer ID'),
    splitType: z.enum(SPLIT_TYPES).default('equal'),
    splits: z.array(expenseSplitInputSchema).min(1, 'At least one participant required'),
    receiptPath: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const sum = data.splits.reduce((acc, s) => acc + s.sharePaise, 0);
      return sum === data.amountPaise;
    },
    {
      message: 'Sum of splits must exactly match total amount in paise',
      path: ['splits'],
    }
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// Settlement schema
export const createSettlementSchema = z.object({
  payerId: z.string().uuid(),
  receiverId: z.string().uuid(),
  amountPaise: z.number().int().positive('Settlement amount must be positive'),
  notes: z.string().max(255).optional(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

// Bill schemas
export const createBillSchema = z.object({
  title: z.string().min(2, 'Bill title required').max(100),
  category: z.enum(BILL_CATEGORIES),
  totalAmountPaise: z.number().int().positive('Total amount must be positive'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Due date must be YYYY-MM-DD'),
  billingPeriod: z.string().min(2, 'Billing period required (e.g. October 2026)'),
  participantUserIds: z.array(z.string().uuid()).min(1, 'Select at least one participant'),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export const payBillShareSchema = z.object({
  amountPaise: z.number().int().positive('Payment amount must be positive'),
});

export type PayBillShareInput = z.infer<typeof payBillShareSchema>;

// Chore schemas
export const createChoreSchema = z.object({
  title: z.string().min(2, 'Chore title required').max(100),
  description: z.string().max(500).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueAt: z.string(), // ISO string
  priority: z.enum(CHORE_PRIORITIES).default('medium'),
  recurrenceRule: z.enum(CHORE_RECURRENCES).default('none'),
});

export type CreateChoreInput = z.infer<typeof createChoreSchema>;

// Grocery schemas
export const createGroceryItemSchema = z.object({
  name: z.string().min(2, 'Item name required').max(100),
  quantity: z.number().positive().default(1),
  unit: z.string().default('units'),
  estimatedPricePaise: z.number().int().nonnegative().default(0),
  assignedTo: z.string().uuid().nullable().optional(),
});

export type CreateGroceryItemInput = z.infer<typeof createGroceryItemSchema>;

export const updateGroceryItemSchema = z.object({
  isPurchased: z.boolean().optional(),
  actualPricePaise: z.number().int().nonnegative().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  quantity: z.number().positive().optional(),
});

export type UpdateGroceryItemInput = z.infer<typeof updateGroceryItemSchema>;

// Maintenance schemas
export const createMaintenanceRequestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().min(5, 'Description is required').max(1000),
  location: z.string().min(2, 'Location in flat required (e.g. Kitchen, Washroom)').max(80),
  priority: z.enum(MAINTENANCE_PRIORITIES).default('medium'),
  assignedTo: z.string().uuid().nullable().optional(),
  imagePath: z.string().nullable().optional(),
});

export type CreateMaintenanceRequestInput = z.infer<typeof createMaintenanceRequestSchema>;

export const updateMaintenanceStatusSchema = z.object({
  status: z.enum(MAINTENANCE_STATUSES),
  assignedTo: z.string().uuid().nullable().optional(),
  resolutionNote: z.string().optional(),
  sharedExpensePaise: z.number().int().nonnegative().optional(),
});

export type UpdateMaintenanceStatusInput = z.infer<typeof updateMaintenanceStatusSchema>;

export const createMaintenanceCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(500),
});

export type CreateMaintenanceCommentInput = z.infer<typeof createMaintenanceCommentSchema>;

// Visitor schemas
export const createVisitorSchema = z.object({
  visitorName: z.string().min(2, 'Visitor name is required').max(80),
  purpose: z.string().min(2, 'Purpose is required').max(120),
  expectedArrival: z.string(), // ISO string
  expectedDeparture: z.string(), // ISO string
  notes: z.string().max(500).optional(),
});

export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;

// Announcement schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(2, 'Title is required').max(120),
  content: z.string().min(5, 'Announcement content is required').max(2000),
  isPinned: z.boolean().default(false),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

// Calendar Event schema
export const createCalendarEventSchema = z.object({
  title: z.string().min(2, 'Event title is required').max(120),
  description: z.string().max(500).optional(),
  eventType: z.enum(EVENT_TYPES).default('social'),
  startAt: z.string(),
  endAt: z.string(),
  linkedRecordType: z.string().nullable().optional(),
  linkedRecordId: z.string().nullable().optional(),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

// Profile update schema
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
