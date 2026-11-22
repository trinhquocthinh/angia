import { BUILD_DATA_EXPORT_QUEUE, buildDataExportJobSchema } from '@angia/contracts';
import { and, eq, sql } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, dataExports, healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import type { DataExportRepository } from '../application/ports.js';

export function createDataExportRepository(
  db: Database,
  boss: PgBoss,
  rateLimit: RateLimitDependencies,
): DataExportRepository {
  return {
    withRequest: (accountId, work) =>
      db.transaction(async (tx) => {
        // Khóa tài khoản để tuần tự hóa kiểm hạn mức và tạo yêu cầu.
        const [account] = await tx
          .select({ id: accounts.id })
          .from(accounts)
          .where(eq(accounts.id, accountId))
          .for('update');
        if (!account) return { ok: false, code: 'ERR_NOT_FOUND' };
        return work({
          rateLimit: { ...rateLimit, store: createRateLimitStore(tx) },
          profileAllowed: (familyId, profileId, requesterId) =>
            withFamilyScope(tx, familyId, async (scoped) => {
              const [profile] = await scoped
                .select({ id: healthProfiles.id })
                .from(healthProfiles)
                .where(
                  and(
                    eq(healthProfiles.id, profileId),
                    eq(healthProfiles.familyId, familyId),
                    sql`NOT EXISTS (SELECT 1 FROM accounts a WHERE a.health_profile_id = ${profileId} AND a.id <> ${requesterId})`,
                  ),
                );
              return Boolean(profile);
            }),
          enqueue: async (profileId) => {
            const [row] = await tx
              .insert(dataExports)
              .values({ accountId, profileId })
              .returning({ id: dataExports.id });
            const payload = buildDataExportJobSchema.parse({ exportId: row!.id });
            const jobId = await boss.send(BUILD_DATA_EXPORT_QUEUE, payload, { db: toPgBossDb(tx) });
            if (!jobId) throw new Error('data_export_enqueue_failed');
            return row!.id;
          },
        });
      }),
    find: async (accountId, id) => {
      const [row] = await db
        .select({
          id: dataExports.id,
          status: dataExports.status,
          objectKey: dataExports.objectKey,
          expiresAt: dataExports.expiresAt,
          createdAt: dataExports.createdAt,
        })
        .from(dataExports)
        .where(and(eq(dataExports.id, id), eq(dataExports.accountId, accountId)));
      return row ?? null;
    },
  };
}
