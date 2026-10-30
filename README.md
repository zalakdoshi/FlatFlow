# FlatFlow 🏠

A flat/apartment management platform for roommates — manage bills, chores, expenses, groceries, and more.

## Features
- 💸 Expense tracking & settlements
- 🧹 Chore scheduling & assignments
- 🛒 Shared grocery lists
- 📢 Announcements board
- 📅 Shared calendar & events
- 🔧 Maintenance requests
- 👥 Visitor management

## Tech Stack
- **Frontend:** React (TypeScript), Vite, TailwindCSS
- **Backend:** Node.js, Express, Drizzle ORM, PostgreSQL
- **Auth:** Supabase

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FlatFlow Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (React + TypeScript)                             │
│  ├─ Dashboard                                              │
│  ├─ Expenses Management                                    │
│  ├─ Bills & Settlements                                    │
│  ├─ Chores Tracking                                        │
│  ├─ Shared Features (Groceries, Events, etc.)              │
│  └─ Supabase Authentication                                │
│           │                                                 │
│           ▼                                                 │
│  Express API (Node.js + TypeScript)                        │
│  ├─ Authentication Middleware (Supabase)                   │
│  ├─ Flat Membership Validation                             │
│  ├─ Route Handlers                                         │
│  │  ├─ Expenses                                            │
│  │  ├─ Bills & Settlements                                 │
│  │  ├─ Chores                                              │
│  │  ├─ Groceries                                           │
│  │  ├─ Maintenance                                         │
│  │  ├─ Visitors                                            │
│  │  ├─ Announcements                                       │
│  │  └─ Events                                              │
│  ├─ Repository Layer (Drizzle ORM)                         │
│  └─ Cross-Household Isolation                              │
│           │                                                 │
│           ▼                                                 │
│  PostgreSQL Database                                       │
│  ├─ Profiles (User accounts)                               │
│  ├─ Flats (Households)                                     │
│  ├─ Flat Members (Permissions & roles)                     │
│  ├─ Expenses & Splits                                      │
│  ├─ Bills & Shares                                         │
│  ├─ Chores                                                 │
│  ├─ Groceries & Items                                      │
│  ├─ Maintenance Requests                                   │
│  ├─ Announcements                                          │
│  └─ Events                                                 │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Shared Packages (@flatflow/shared)                │    │
│  │  ├─ TypeScript Types                               │    │
│  │  ├─ Zod Schemas (Validation)                        │    │
│  │  └─ Settlement Algorithms                           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

Authentication Flow:
1. User logs in via Supabase Auth (Email/Password or OAuth)
2. Frontend receives JWT token
3. Token sent with API requests (Authorization header)
4. Backend validates token with Supabase
5. Middleware enforces flat membership & role-based access
6. All queries isolated by flatId (cross-household protection)
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL or Supabase project
- npm 10+

### Setup
```bash
# Install dependencies
npm install

# Setup environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run both services concurrently
npm run dev:all
```

The `npm run dev:all` command uses `concurrently` to start both the frontend (React dev server on port 5173) and backend API (Express server on port 3001) simultaneously.

## Environment Variables

**`apps/api/.env`**
```
DATABASE_URL=your_postgres_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3001
```

**`apps/web/.env`**
```
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Screenshots

### Dashboard
The main dashboard provides an at-a-glance view of household activity, recent expenses, pending chores, and upcoming events. Members can quickly see their financial balance and important notifications.

### Expenses Management
Track and split shared expenses. FlatFlow automatically calculates who owes whom based on the configured settlement algorithm. Supports multiple split strategies (equal, custom, item-wise).

### Settlements & Bills
View and manage bill payments and settlements. The system tracks who has paid what and calculates outstanding balances. Mark bills as paid and generate settlement receipts.

### Chores Tracking
Schedule and assign household chores with recurring options. Track completion status and view chore history. Helps ensure fair distribution of household responsibilities.

### Additional Features
- **Shared Grocery Lists**: Collaborative grocery shopping with item assignments
- **Announcements**: Post important household announcements
- **Maintenance Requests**: Log and track maintenance issues
- **Visitor Management**: Keep records of visitors and guest stays
- **Shared Calendar**: Upcoming events and important dates

## Project Structure

```
FlatFlow/
├── apps/
│   ├── api/                    # Express backend (TypeScript)
│   │   ├── src/
│   │   │   ├── db/            # Database schema, migrations, seeds
│   │   │   ├── middleware/    # Auth, flat membership validation
│   │   │   ├── repositories/  # Data access layer (Drizzle ORM)
│   │   │   ├── routes/        # API endpoint handlers
│   │   │   ├── types/         # TypeScript type definitions
│   │   │   ├── app.ts         # Express app setup
│   │   │   └── server.ts      # Server entry point
│   │   ├── test/              # Integration tests (Vitest)
│   │   └── package.json
│   └── web/                   # React frontend (TypeScript)
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── pages/         # Page components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── lib/           # Utility functions
│       │   └── App.tsx        # Main app component
│       └── package.json
├── packages/
│   └── shared/                # Shared TypeScript types & schemas
│       ├── src/
│       │   ├── types/         # Shared type definitions
│       │   ├── schemas/       # Zod validation schemas
│       │   └── lib/           # Shared utilities
│       └── package.json
├── package.json               # Root workspace configuration
└── README.md
```

## Documentation

- **[API Endpoints](docs/API.md)** - Complete API endpoint reference
- **[Database Schema](docs/DATABASE.md)** - Database structure and relationships
- **[Settlement Algorithm](docs/SETTLEMENT-ALGORITHM.md)** - How expenses are settled between flatmates

## Development

### Available Commands

```bash
# Development
npm run dev:all          # Start both frontend and backend
npm run dev:web          # Start only frontend
npm run dev:api          # Start only backend

# Building
npm run build            # Build all packages
npm run build:web        # Build frontend
npm run build:api        # Build backend

# Database
npm run db:migrate       # Run pending migrations
npm run db:push          # Push schema changes to database
npm run db:seed          # Seed database with example data
npm run db:studio        # Open Drizzle Studio UI

# Testing & Quality
npm run test             # Run all tests
npm run typecheck        # TypeScript type checking

# Deployment
npm run build            # Build all applications
```

### Running Tests

```bash
cd apps/api
npm test
```

Tests cover:
- Authentication and authorization boundaries
- Cross-household data isolation
- Role-based access control
- API endpoint functionality
- Settlement calculations
