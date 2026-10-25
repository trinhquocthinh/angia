import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type pg from 'pg';
import * as schema from './schema/index.js';

export type Database = NodePgDatabase<typeof schema>;

// Pool phải kết nối bằng role app NOBYPASSRLS (DATABASE_URL), không bao giờ dùng role owner.
export function createDatabase(pool: pg.Pool): Database {
  return drizzle(pool, { schema });
}
