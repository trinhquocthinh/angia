import { sql } from 'drizzle-orm';
import { adminAuditEventSchema } from '@angia/contracts';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { AdminAuditRepository } from '../application/ports.js';

export function createAdminAuditRepository(db: Database): AdminAuditRepository {
  return {
    async list(q) {
      // Giữ microsecond để cursor không bỏ sót các sự kiện trong cùng millisecond.
      const result = await db.execute(sql`
        SELECT id, to_char(occurred_at AT TIME ZONE 'UTC',
          'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS occurred_at,
          actor_account_id, family_id, target_account_id, target_profile_id, action, metadata
        FROM public.admin_audit_events_list(
          ${q.from ?? null}::timestamptz, ${q.to ?? null}::timestamptz,
          ${q.familyId ?? null}::uuid, ${q.accountId ?? null}::uuid, ${q.action ?? null}::text,
          ${q.before?.at ?? null}::timestamptz, ${q.before?.id ?? null}::uuid, ${q.limit}::integer)
      `);
      return result.rows.map((r) =>
        adminAuditEventSchema.parse({
          id: r.id,
          occurredAt: r.occurred_at,
          actorAccountId: r.actor_account_id,
          familyId: r.family_id,
          targetAccountId: r.target_account_id,
          targetProfileId: r.target_profile_id,
          action: r.action,
          metadata: r.metadata,
        }),
      );
    },
  };
}
