import { isDatabaseConfigured } from '../db/index.js';
import { createMemoryRepositories } from './memory.js';
import { createPgRepositories } from './postgres.js';
import type { IRepositories } from './types.js';

export * from './types.js';

let activeRepositories: IRepositories | null = null;

export function getRepositories(): IRepositories {
  if (activeRepositories) return activeRepositories;

  const adapterPreference = process.env.DATA_STORE_ADAPTER?.toLowerCase();

  if (adapterPreference === 'memory') {
    console.log('ℹ️  [Data Layer] Explicitly using in-memory adapter (DATA_STORE_ADAPTER=memory).');
    activeRepositories = createMemoryRepositories();
    return activeRepositories;
  }

  if (isDatabaseConfigured()) {
    console.log('🐘 [Data Layer] Connected to persistent Supabase PostgreSQL via Drizzle ORM.');
    activeRepositories = createPgRepositories();
    return activeRepositories;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL environment variable is required in production mode. Set DATABASE_URL in your hosting environment.'
    );
  }

  console.warn(
    '⚠️  [Data Layer] DATABASE_URL is not set. Operating in local in-memory development mode.\n' +
    '   To connect to your persistent Supabase PostgreSQL database, configure DATABASE_URL in apps/api/.env'
  );
  activeRepositories = createMemoryRepositories();
  return activeRepositories;
}

export const repositories: IRepositories = new Proxy({} as IRepositories, {
  get(_target, prop: keyof IRepositories) {
    const repos = getRepositories();
    return repos[prop];
  },
});
