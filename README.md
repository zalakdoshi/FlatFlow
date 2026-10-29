# FlatFlow — Smart Shared Living Platform

> A production-minded, responsive, multi-user web application built for flatmates and roommates to manage shared expenses, split bills, automate fair chore rotation, organize groceries in real-time, coordinate maintenance, and track visitors seamlessly.

---

## 🚀 Key Modules & Capabilities

FlatFlow is organized into **10 cohesive household modules** built around a unified multi-tenant flat and membership authorization model:

1. **Overview Dashboard**
   - Live KPI cards: Total monthly spending, user net balance (owe / owed indicator), pending chores count, upcoming bills count.
   - Recharts visual analytics: Monthly spending area chart and donut chart breakdown by category (Groceries, Utilities, Rent, Dining, etc.).
   - Quick action triggers: Add Expense, Assign Chore, Add Grocery, Report Issue.
   - Real-time recent activity stream.

2. **Expense Splitting & Reconciliation**
   - Currency stored in smallest unit (**Paise for INR**) as integers to prevent floating-point inaccuracies.
   - 4 Split Modes: **Equal Split** (with exact remainder distribution), **Custom Exact Amount**, **Percentage**, and **Shares**.
   - Server-side Zod validation ensuring `sum(splits) === totalPaise`.
   - Filter by category, payer, search term, and 1-click **CSV Report Export**.

3. **Smart Settlement Optimizer**
   - Implements a greedy **min-cash-flow debt reduction algorithm**.
   - Simplifies multiple complex roommate debts into the minimal set of peer-to-peer transfers (e.g. `Rahul pays Zalak ₹450`).
   - 1-click "Record Payment" button to settle debts and reconcile balances in real-time.

4. **Bills & Rent Tracking**
   - Rent, Bescom Electricity, Airtel Fiber Wi-Fi, Water, Gas, and society maintenance tracking.
   - Due date indicators with countdown alerts and contribution progress bars.
   - "Pay My Share" action allowing roommates to mark their individual share paid.

5. **Chores Scheduler & Fairness Engine**
   - Cleaning, dishwashing, cooking, and garbage sorting tasks with priority flags (Low, Medium, High, Urgent).
   - **Fairness Score Tracker**: Computes assignment counts, completion rates, and balance ratings per roommate.
   - **Auto-Rotate**: Automatically reassigns a chore to the roommate with the fewest active tasks to prevent unfair repetition.
   - Celebratory confetti particle explosion upon chore completion.

6. **Shared Grocery List**
   - Real-time collaborative shopping list with instant strike-through.
   - Item quantities, units, estimated vs. actual pricing, and assigned purchasers.
   - Automatic estimated spending totals.

7. **Maintenance Request Workflow**
   - Report household issues (plumbing, electrical, appliances) with location and severity flags.
   - Status pipeline: `Open` &rarr; `In Progress` &rarr; `Resolved`.
   - Comment threads for technician and landlord updates.

8. **Visitor Management**
   - Register guest names, host roommate, purpose, expected arrival/departure.
   - 1-click **Check-in** and **Check-out** buttons with status timestamps.
   - Scoped strictly to flat members for household privacy.

9. **Announcements & Discussion**
   - Pin important household notices (water cuts, elevator maintenance, rent deadlines).
   - Read receipt tracking ("Acknowledged by 3 roommates").

10. **Shared Household Calendar**
    - Integrated schedule automatically aggregating chores, bill due dates, visitor arrivals, and custom house meetings.
    - Category filter tabs (All, Chore, Bill, Visitor, Social).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router 7, TanStack Query, React Hook Form, Zod, Recharts, Canvas Confetti |
| **Backend** | Node.js (LTS), Express.js, TypeScript, Drizzle ORM, `pg` (PostgreSQL client), Zod validation, CORS, Dotenv |
| **Database & Auth** | Supabase PostgreSQL, Supabase Auth, Supabase Realtime, Supabase Storage |
| **Testing** | Vitest, Supertest for Express API integration testing |
| **Architecture** | npm workspaces monorepo (`packages/shared`, `apps/api`, `apps/web`) |

---

## 📂 Monorepo Structure

```
flatflow/
├── apps/
│   ├── api/                     # Node.js + Express backend REST API
│   │   ├── src/
│   │   │   ├── db/              # Drizzle schema, migrations (0000_init.sql), connection
│   │   │   ├── lib/             # Supabase server verification client
│   │   │   ├── middleware/      # Auth, Flat-membership guard, Error handler
│   │   │   ├── repositories/    # In-memory store & seed data fallback
│   │   │   ├── routes/          # 12 Express modular routers (flats, expenses, etc.)
│   │   │   ├── app.ts           # Express app instance
│   │   │   └── server.ts        # Server entry point
│   │   ├── test/                # API integration test suite (Vitest + Supertest)
│   │   └── package.json
│   │
│   └── web/                     # React + Vite frontend SPA
│       ├── src/
│       │   ├── components/      # Navbar, Sidebar, Modal, Badge
│       │   ├── context/         # AuthContext with Supabase & demo switchers
│       │   ├── lib/             # Centralized Fetch API client, Supabase browser client
│       │   ├── pages/           # 11 Module pages & Login/Signup/Onboarding
│       │   ├── App.tsx          # Router and protected layout
│       │   └── main.tsx         # React root
│       └── package.json
│
├── packages/
│   └── shared/                  # Domain constants, types, Zod schemas, algorithms
│       ├── src/
│       │   ├── constants.ts     # Roles, categories, statuses
│       │   ├── types.ts         # TypeScript interfaces
│       │   ├── schemas.ts       # Request validation schemas
│       │   ├── utils/money.ts   # Paise conversion & split reconciliation
│       │   ├── utils/settlement.ts # Smart Settlement Optimizer algorithm
│       │   └── utils/chores.ts  # Chore fairness & rotation algorithm
│       └── package.json
│
├── package.json                 # Monorepo npm workspaces configuration
├── .gitignore
└── README.md
```

---

## 🔑 Environment Variables

### Frontend: `apps/web/.env.local`
```env
VITE_SUPABASE_URL=https://ompqsnpvybzgjikwhzjs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=replace_with_publishable_key
VITE_API_URL=http://localhost:3000
```

### Backend: `apps/api/.env`
```env
PORT=3000
DATABASE_URL=postgresql://postgres.ompqsnpvybzgjikwhzjs:replace_with_db_password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://ompqsnpvybzgjikwhzjs.supabase.co
SUPABASE_PUBLISHABLE_KEY=replace_with_publishable_key
SUPABASE_SERVICE_ROLE_KEY=replace_with_service_role_key_optional
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🏃 Quick Start Guide (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database & Environment
1. Copy `.env.example` in `apps/api/` to `apps/api/.env`:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
2. In Supabase Dashboard, retrieve your PostgreSQL connection string:
   - Navigate to **Project Settings** &rarr; **Database** &rarr; **Connection string**.
   - Select **URI** and either **Session / Transaction Pooler (Port 6543)** (recommended for IPv4/Node.js) or **Direct (Port 5432)**.
   - Set `DATABASE_URL` in `apps/api/.env` with your actual password.
   *(Note: Never commit `apps/api/.env` to Git; it is already excluded in `.gitignore`.)*

### 3. Review & Apply Database Migrations
1. Review the initial migration SQL file before applying:
   - Inspect [apps/api/src/db/migrations/0000_init.sql](apps/api/src/db/migrations/0000_init.sql). All 22 tables use `CREATE TABLE IF NOT EXISTS` and include indexes, foreign keys, and Row Level Security.
2. Apply the migration safely:
   ```bash
   npm run db:migrate
   ```
   *Alternative for rapid prototyping without migration tracking:* `npm run db:push`.

3. Launch Drizzle Studio to visually inspect tables and rows:
   ```bash
   npm run db:studio
   ```
   Drizzle Studio will open locally at `https://local.drizzle.studio`.

### 4. Run API Integration Tests & Typecheck
```bash
npm run typecheck
npm run test --workspace=apps/api
```
All backend integration tests run verifying health checks, flat membership security (403 forbidden protection), expense split reconciliation, chore rotation, settlements, and visitor logs.

### 5. Start the Backend API Server
```bash
npm run dev:api
```
API server runs on `http://localhost:3000`. You will see `[Database] Connected to PostgreSQL with Drizzle ORM.` in the startup logs.
*(If `DATABASE_URL` is not provided or `DATA_STORE_ADAPTER=memory`, it gracefully falls back to the in-memory adapter.)*

### 6. Start the Frontend Application
```bash
npm run dev:web
```
Vite dev server starts on `http://localhost:5173`. Open in your browser to experience the platform!

### 7. Test Data Persistence
1. With `DATABASE_URL` configured and migrations applied, open `http://localhost:5173`.
2. Add a new expense, chore, or maintenance ticket.
3. Stop the backend server (`Ctrl + C`) and restart it (`npm run dev:api`).
4. Refresh your browser; all data remains intact in PostgreSQL.

---

## 🛡️ Security & Engineering Best Practices

- **Strict Flat Membership Guard**: Every endpoint under `/api/flats/:flatId/*` enforces `requireFlatMembership` middleware. A user from Flat A can never read or mutate records from Flat B.
- **Financial Precision in Paise**: Monetary transactions are computed as integers (`amountPaise`), preventing floating-point discrepancies (`0.1 + 0.2 !== 0.3`).
- **Exact Split Reconciliation**: The backend validates that `sum(splits) === amountPaise` before persisting expenses.
- **Supabase Authentication**: Passwords and user credentials are encrypted and stored in Supabase Auth, never in plain application tables.
- **Instant Demo Roommate Switcher**: Located in the top navbar, allowing reviewers to simulate multiple roommates (Zalak, Rahul, Ananya, Vikram) with 1 click to test permissions, balances, and personalized dashboard views.
