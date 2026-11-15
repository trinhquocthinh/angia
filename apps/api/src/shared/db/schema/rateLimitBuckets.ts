import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

// Chỉ lưu khoá đã băm; dùng trước đăng nhập nên không RLS family.
export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    keyHash: text('key_hash').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.keyHash, t.windowStart] }),
    index('rate_limit_buckets_window_start_idx').on(t.windowStart),
    check('rate_limit_buckets_count_nonnegative', sql`${t.count} >= 0`),
  ],
);
