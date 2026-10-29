import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const isDatabaseConfigured = (): boolean => {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
    !url.includes('replace_with_') &&
    !url.includes('YOUR_DATABASE_PASSWORD') &&
    !url.includes('[YOUR-PASSWORD]') &&
    url.startsWith('postgres')
  );
};

let pool: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!isDatabaseConfigured()) {
    return null;
  }
  if (!dbInstance) {
    const isRemote =
      Boolean(process.env.DATABASE_URL?.includes('supabase')) ||
      Boolean(process.env.DATABASE_URL?.includes('pooler')) ||
      process.env.NODE_ENV === 'production';

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
    });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export function getPool() {
  getDb();
  return pool;
}

export { schema };
