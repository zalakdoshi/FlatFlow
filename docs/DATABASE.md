# FlatFlow Database Schema

## Overview

FlatFlow uses PostgreSQL as its primary database with Drizzle ORM for type-safe data access. The schema is designed to support multi-household isolation with complete data segregation between flats.

## Core Principles

1. **Multi-Tenancy**: All tables include `flatId` for household isolation except user-specific tables
2. **Data Integrity**: Foreign keys with cascade deletes maintain referential integrity
3. **Performance**: Strategic indexes on frequently queried columns
4. **Auditability**: Created/updated timestamps and activity logs track changes

---

## Key Tables

### Profiles
User profile information linked to Supabase Auth. Stores name, avatar, phone.

### Flats
Represents a household. Each flat is independent and contains all related data scoped by `flatId`.

### Flat Members
Controls who is in a flat and their role (owner, admin, member). Enforces unique `(flatId, userId)` membership.

### Expenses & Expense Splits
Tracks shared expenses and how they're split among members. The settlement algorithm calculates who owes whom based on these splits.

### Bills & Bill Shares
Recurring bills (rent, utilities) and individual payment status for each member.

### Chores
Household tasks with assignment, priority, recurrence, and fairness scoring for automatic rotation.

### Grocery Lists & Items
Shared shopping lists with purchase status and member assignments.

### Maintenance Requests
Track maintenance issues with status, priority, assignment, and comments.

### Visitors
Guest log entries with check-in/out times.

### Announcements
Important household announcements with pinning and read-tracking.

### Events
Calendar events for household dates.

### Notifications
In-app notification queue for household members.

### Activity Logs
Audit trail of all changes in the household.

---

## Data Isolation & Multi-Tenancy

### Cross-Household Isolation

Every query in the application includes `WHERE flatId = ?` to prevent cross-household data access:

```javascript
// Example: Get expenses only for the specified flat
const expenses = await db
  .select()
  .from(expensesTable)
  .where(eq(expensesTable.flatId, flatId));
```

### Authorization Layers

1. **Authentication** - JWT token validated against Supabase
2. **Flat Membership** - User must be in the flat's members table
3. **Role-Based Access** - Some operations restricted to owners/admins
4. **Query Isolation** - All queries filtered by flatId

---

## Migrations

### Running Migrations

```bash
# Apply pending migrations to database
npm run db:push --workspace=apps/api

# View migration status
npm run db:status --workspace=apps/api
```

### Creating Migrations

Migrations are auto-generated from schema changes:

```bash
# After modifying schema.ts, generate migration
npm run db:generate --workspace=apps/api
```

### Migration Files

Located in `apps/api/src/db/migrations/`. Each migration:
- Is timestamped for ordering
- Contains up and down migrations
- Is automatically applied on deployment

---

## Seeding Data

### Development Seed

```bash
npm run db:seed --workspace=apps/api
```

Seeds test data including:
- Sample users and profiles
- Test households
- Example expenses with settlements
- Bills and chores
- Grocery lists

### Seed Script Location

`apps/api/src/db/seed.ts` - Customizable for different scenarios

---

## Relationships

### Primary Relationships

```
Profiles (1) ──→ (many) Flat Members
   ↓
   └──→ (many) Expenses (as payer)
   └──→ (many) Settlements (as payer/receiver)
   └──→ (many) Chores (as assignee)
   └──→ (many) Bills (as creator)

Flats (1) ──→ (many) Flat Members
   ├──→ (many) Expenses
   ├──→ (many) Bills
   ├──→ (many) Chores
   ├──→ (many) Announcements
   ├──→ (many) Events
   ├──→ (many) Maintenance Requests
   └──→ (many) Visitor Records

Expenses (1) ──→ (many) Expense Splits
```

---

## Indexes for Performance

### Frequently Indexed Columns

- `flatId` - Almost every table, enables rapid household filtering
- `userId` - User-related queries
- `createdAt` - Range queries by date
- Status columns - Filtering by state (pending, completed, etc.)
- Boolean flags - `isPurchased`, `isPinned`, `readAt`

### Sample Queries and Their Indexes

```sql
-- Get all expenses for a flat (flatId index)
SELECT * FROM expenses WHERE flat_id = $1

-- Find user's active settlements (userId + status indexes)
SELECT * FROM settlements WHERE payer_id = $1 AND status = 'completed'

-- Bills due soon (flatId + dueDate indexes)
SELECT * FROM bills WHERE flat_id = $1 AND due_date >= TODAY()

-- Unread announcements (flatId + isPinned indexes)
SELECT * FROM announcements WHERE flat_id = $1 ORDER BY is_pinned DESC
```

---

## Settlement Algorithm Integration

The database supports the settlement algorithm through:

1. **Expense Splits** - Tracks who owes what for each expense
2. **Settlements Table** - Records payments and transfers
3. **Bill Shares** - Tracks bill payment status
4. **Computation** - Application layer calculates balances from these records

### Settlement Query Pattern

```javascript
// Get all unsettled expense splits for a user
const balances = await db
  .select()
  .from(expenseSplits)
  .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
  .where(
    and(
      eq(expenses.flatId, flatId),
      eq(expenseSplits.userId, userId),
      eq(expenseSplits.status, 'pending')
    )
  );
```

---

## Constraint Rules

### Cascade Delete
- Deleting a flat cascades to all related records (expenses, bills, chores, etc.)
- Deleting an expense cascades to all its splits
- Deleting a bill cascades to all its shares

### Unique Constraints
- `(flatId, userId)` in flatMembers - One membership per person per flat
- Invitation code - Cannot reuse same code
- `(announcementId, userId)` in announcementReads - Track who read each announcement

### Check Constraints
- `amountPaise >= 0` - No negative amounts
- `paidAmountPaise <= sharePaise` - Cannot overpay
- `startAt < endAt` in events - Valid time ranges

---

## Enum-Like Values

### Member Roles
- `owner` - Created the flat, full permissions
- `admin` - Can manage most features
- `member` - Standard member

### Expense Categories
- `food`
- `utilities`
- `rent`
- `entertainment`
- `other`

### Chore Status
- `pending` - Not started
- `in_progress` - Someone is working on it
- `completed` - Finished
- `overdue` - Due date passed

### Bill Status
- `pending` - No payments yet
- `partially_paid` - Some shares paid
- `paid` - All shares paid
- `overdue` - Past due date

---

## Backing Up & Recovery

### Database Backup (Supabase)

```bash
# Automated backups run daily
# Access via Supabase dashboard
```

### Local Development Backups

```bash
# Dump PostgreSQL database
pg_dump postgresql://user:pass@localhost/flatflow > backup.sql

# Restore from backup
psql postgresql://user:pass@localhost/flatflow < backup.sql
```

---

## Performance Considerations

1. **Query Optimization**: Always include `flatId` in WHERE clauses
2. **Pagination**: Use LIMIT/OFFSET for large result sets
3. **Index Usage**: Drizzle automatically uses indexes; verify with EXPLAIN ANALYZE
4. **N+1 Prevention**: Use JOINs instead of multiple queries
5. **Data Normalization**: Splits are stored separately from expenses to avoid duplication

---

## Development Tools

### Drizzle Studio UI
Interactive database browser:
```bash
npm run db:studio --workspace=apps/api
```

Access schema, query data, and run migrations graphically.

### Database Introspection
View current schema:
```bash
npm run db:introspect --workspace=apps/api
```
