import { config } from '@/lib/config';
import { SQLiteAdapter } from './adapters/sqlite';
import { PostgreSQLAdapter } from './adapters/postgresql';
import type { DatabaseAdapter } from './adapter';

let adapter: DatabaseAdapter;

if (config.db.type === 'postgresql') {
  adapter = new PostgreSQLAdapter(process.env.DATABASE_URL!);
} else {
  if (process.env.VERCEL) {
    throw new Error(
      'SQLite is not supported on Vercel (read-only filesystem). ' +
      'Please set DB_TYPE=postgresql and DATABASE_URL in your Vercel environment variables.',
    );
  }
  adapter = new SQLiteAdapter(process.env.SQLITE_PATH || './data/careerhelper.db');
}

// Initialize (migrate + seed) — must complete before first query.
// Store the promise so consumers can await it if needed.
const _initPromise = adapter.initialize().catch((e) =>
  console.error('[DB] Initialize failed:', e)
);

/** Await this before any DB operation to ensure tables exist */
export const dbReady = _initPromise;

export const db = adapter.db;
export { adapter };
