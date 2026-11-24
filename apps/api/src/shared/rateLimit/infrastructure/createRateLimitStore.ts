import { and, eq, sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { rateLimitBuckets } from '@src/shared/db/schema/rateLimitBuckets.js';
import type { RateLimitStore } from '../application/ports.js';

export function createRateLimitStore(db: Database | FamilyScopedTx): RateLimitStore {
  return {
    async increment(keyHash, windowStart) {
      const [row] = await db
        .insert(rateLimitBuckets)
        .values({ keyHash, windowStart: new Date(windowStart), count: 1 })
        .onConflictDoUpdate({
          target: [rateLimitBuckets.keyHash, rateLimitBuckets.windowStart],
          set: { count: sql`${rateLimitBuckets.count} + 1` },
        })
        .returning({ count: rateLimitBuckets.count });
      return row!.count;
    },
    async read(keyHash, windowStart) {
      const [row] = await db
        .select({ count: rateLimitBuckets.count })
        .from(rateLimitBuckets)
        .where(
          and(eq(rateLimitBuckets.keyHash, keyHash), eq(rateLimitBuckets.windowStart, new Date(windowStart))),
        );
      return row?.count ?? 0;
    },
  };
}
