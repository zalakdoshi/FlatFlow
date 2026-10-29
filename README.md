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

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL or Supabase project

### Setup
```bash
npm install

# Setup env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run both apps
npm run dev
```

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
