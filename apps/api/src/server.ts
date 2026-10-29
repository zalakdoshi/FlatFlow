import * as dotenv from 'dotenv';
import { createApp } from './app.js';
import { isDatabaseConfigured } from './db/index.js';

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const app = createApp();

app.listen(port, () => {
  const isDb = isDatabaseConfigured();
  const isExplicitMemory = process.env.DATA_STORE_ADAPTER === 'memory';

  console.log(`===============================================`);
  console.log(`🚀 FlatFlow API server running on http://localhost:${port}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `🗄️ Database Adapter: ${
      isDb && !isExplicitMemory
        ? 'PostgreSQL (Supabase Drizzle ORM - Persistent)'
        : isExplicitMemory
        ? 'In-Memory Adapter (Explicitly Selected via DATA_STORE_ADAPTER=memory)'
        : 'In-Memory Fallback (Set DATABASE_URL in apps/api/.env to connect Supabase)'
    }`
  );
  console.log(`===============================================`);
});
