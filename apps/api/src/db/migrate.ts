import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('replace_with_')) {
    console.warn('⚠️  DATABASE_URL is not configured. Skipping PostgreSQL migration.');
    return;
  }

  console.log('🔄 Connecting to PostgreSQL database for migration...');
  const isRemote =
    connectionString.includes('supabase') ||
    connectionString.includes('pooler') ||
    process.env.NODE_ENV === 'production';

  const pool = new pg.Pool({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    const migrationPath = path.join(__dirname, 'migrations', '0000_init.sql');
    if (fs.existsSync(migrationPath)) {
      console.log(`📜 Executing migration SQL: ${migrationPath}`);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await client.query(sql);
      console.log('✅ FlatFlow database migration applied successfully!');
    } else {
      console.warn('⚠️  No migration file found at', migrationPath);
    }
    client.release();
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
