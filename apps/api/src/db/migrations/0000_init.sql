-- FlatFlow Schema Migration 0000_init.sql
-- Enables UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID PRIMARY KEY,
  "full_name" VARCHAR(100) NOT NULL,
  "avatar_url" TEXT,
  "phone" VARCHAR(20),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. flats
CREATE TABLE IF NOT EXISTS "flats" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(100) NOT NULL,
  "address_label" VARCHAR(255),
  "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
  "created_by" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. flat_members
CREATE TABLE IF NOT EXISTS "flat_members" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "role" VARCHAR(20) NOT NULL DEFAULT 'member',
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "unique_flat_member" UNIQUE ("flat_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "flat_member_flat_idx" ON "flat_members"("flat_id");
CREATE INDEX IF NOT EXISTS "flat_member_user_idx" ON "flat_members"("user_id");

-- 4. flat_invites
CREATE TABLE IF NOT EXISTS "flat_invites" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "token_hash" VARCHAR(255) NOT NULL,
  "code" VARCHAR(32) NOT NULL UNIQUE,
  "invited_by" UUID NOT NULL REFERENCES "profiles"("id"),
  "expires_at" TIMESTAMPTZ NOT NULL,
  "max_uses" INTEGER NOT NULL DEFAULT 10,
  "use_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "invite_flat_idx" ON "flat_invites"("flat_id");
CREATE INDEX IF NOT EXISTS "invite_code_idx" ON "flat_invites"("code");

-- 5. expenses
CREATE TABLE IF NOT EXISTS "expenses" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "payer_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "description" VARCHAR(255) NOT NULL,
  "category" VARCHAR(50) NOT NULL DEFAULT 'other',
  "amount_paise" INTEGER NOT NULL,
  "expense_date" VARCHAR(12) NOT NULL,
  "receipt_path" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "expenses_flat_idx" ON "expenses"("flat_id");
CREATE INDEX IF NOT EXISTS "expenses_payer_idx" ON "expenses"("payer_id");
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses"("expense_date");

-- 6. expense_splits
CREATE TABLE IF NOT EXISTS "expense_splits" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "expense_id" UUID NOT NULL REFERENCES "expenses"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "share_paise" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "splits_expense_idx" ON "expense_splits"("expense_id");
CREATE INDEX IF NOT EXISTS "splits_user_idx" ON "expense_splits"("user_id");

-- 7. settlements
CREATE TABLE IF NOT EXISTS "settlements" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "payer_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "receiver_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "amount_paise" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
  "settled_at" TIMESTAMPTZ DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "settlements_flat_idx" ON "settlements"("flat_id");
CREATE INDEX IF NOT EXISTS "settlements_payer_idx" ON "settlements"("payer_id");
CREATE INDEX IF NOT EXISTS "settlements_receiver_idx" ON "settlements"("receiver_id");

-- 8. bills
CREATE TABLE IF NOT EXISTS "bills" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "title" VARCHAR(150) NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "total_amount_paise" INTEGER NOT NULL,
  "due_date" VARCHAR(12) NOT NULL,
  "billing_period" VARCHAR(50) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "created_by" UUID NOT NULL REFERENCES "profiles"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "bills_flat_idx" ON "bills"("flat_id");
CREATE INDEX IF NOT EXISTS "bills_due_date_idx" ON "bills"("due_date");
CREATE INDEX IF NOT EXISTS "bills_status_idx" ON "bills"("status");

-- 9. bill_shares
CREATE TABLE IF NOT EXISTS "bill_shares" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "bill_id" UUID NOT NULL REFERENCES "bills"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "share_paise" INTEGER NOT NULL,
  "paid_amount_paise" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS "bill_shares_bill_idx" ON "bill_shares"("bill_id");
CREATE INDEX IF NOT EXISTS "bill_shares_user_idx" ON "bill_shares"("user_id");

-- 10. chores
CREATE TABLE IF NOT EXISTS "chores" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "title" VARCHAR(150) NOT NULL,
  "description" TEXT,
  "assigned_to" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
  "created_by" UUID NOT NULL REFERENCES "profiles"("id"),
  "due_at" TIMESTAMPTZ NOT NULL,
  "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "recurrence_rule" VARCHAR(20) NOT NULL DEFAULT 'none',
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "chores_flat_idx" ON "chores"("flat_id");
CREATE INDEX IF NOT EXISTS "chores_assigned_idx" ON "chores"("assigned_to");
CREATE INDEX IF NOT EXISTS "chores_due_idx" ON "chores"("due_at");
CREATE INDEX IF NOT EXISTS "chores_status_idx" ON "chores"("status");

-- 11. chore_history
CREATE TABLE IF NOT EXISTS "chore_history" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "chore_id" UUID NOT NULL REFERENCES "chores"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "action" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. grocery_lists
CREATE TABLE IF NOT EXISTS "grocery_lists" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL DEFAULT 'Household Groceries',
  "created_by" UUID NOT NULL REFERENCES "profiles"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. grocery_items
CREATE TABLE IF NOT EXISTS "grocery_items" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "list_id" UUID NOT NULL REFERENCES "grocery_lists"("id") ON DELETE CASCADE,
  "name" VARCHAR(150) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit" VARCHAR(30) NOT NULL DEFAULT 'units',
  "estimated_price_paise" INTEGER NOT NULL DEFAULT 0,
  "actual_price_paise" INTEGER,
  "added_by" UUID NOT NULL REFERENCES "profiles"("id"),
  "assigned_to" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
  "is_purchased" BOOLEAN NOT NULL DEFAULT FALSE,
  "purchased_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. maintenance_requests
CREATE TABLE IF NOT EXISTS "maintenance_requests" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "title" VARCHAR(150) NOT NULL,
  "description" TEXT NOT NULL,
  "location" VARCHAR(100) NOT NULL,
  "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "status" VARCHAR(20) NOT NULL DEFAULT 'open',
  "reported_by" UUID NOT NULL REFERENCES "profiles"("id"),
  "assigned_to" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
  "image_path" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolved_at" TIMESTAMPTZ
);

-- 15. maintenance_comments
CREATE TABLE IF NOT EXISTS "maintenance_comments" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "request_id" UUID NOT NULL REFERENCES "maintenance_requests"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "comment" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. visitors
CREATE TABLE IF NOT EXISTS "visitors" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "visitor_name" VARCHAR(100) NOT NULL,
  "host_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "purpose" VARCHAR(150) NOT NULL,
  "expected_arrival" TIMESTAMPTZ NOT NULL,
  "expected_departure" TIMESTAMPTZ NOT NULL,
  "checked_in_at" TIMESTAMPTZ,
  "checked_out_at" TIMESTAMPTZ,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. announcements
CREATE TABLE IF NOT EXISTS "announcements" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "author_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "title" VARCHAR(150) NOT NULL,
  "content" TEXT NOT NULL,
  "is_pinned" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. announcement_reads
CREATE TABLE IF NOT EXISTS "announcement_reads" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "announcement_id" UUID NOT NULL REFERENCES "announcements"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "read_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "unique_announcement_read" UNIQUE ("announcement_id", "user_id")
);

-- 19. events
CREATE TABLE IF NOT EXISTS "events" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "title" VARCHAR(150) NOT NULL,
  "description" TEXT,
  "event_type" VARCHAR(30) NOT NULL DEFAULT 'social',
  "start_at" TIMESTAMPTZ NOT NULL,
  "end_at" TIMESTAMPTZ NOT NULL,
  "created_by" UUID NOT NULL REFERENCES "profiles"("id"),
  "linked_record_type" VARCHAR(50),
  "linked_record_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "recipient_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(150) NOT NULL,
  "message" TEXT NOT NULL,
  "linked_record_type" VARCHAR(50),
  "linked_record_id" UUID,
  "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. activity_logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "flat_id" UUID NOT NULL REFERENCES "flats"("id") ON DELETE CASCADE,
  "actor_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "action" VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" UUID NOT NULL,
  "previous_values" TEXT,
  "new_values" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. flat_requests
CREATE TABLE IF NOT EXISTS "flat_requests" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(100) NOT NULL,
  "address_label" VARCHAR(255),
  "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
  "requested_by" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "requester_name" VARCHAR(100) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "approved_at" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "flat_requests_status_idx" ON "flat_requests"("status");
CREATE INDEX IF NOT EXISTS "flat_requests_requester_idx" ON "flat_requests"("requested_by");

-- Supabase Row Level Security (RLS) Configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper security function to check flat membership
CREATE OR REPLACE FUNCTION is_flat_member(flat_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM flat_members
    WHERE flat_members.flat_id = flat_uuid
    AND flat_members.user_id = auth.uid()
    AND flat_members.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
