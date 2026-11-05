import { budgetMonth } from '@angia/contracts';
import { sql } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import { requestScanQuotaRequeue } from './requestScanQuotaRequeue.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import type {
  ScanQuotaContext,
  ScanQuotaDefaults,
  ScanQuotaOutcome,
  ScanQuotaRepository,
} from '../application/ports.js';
import { lockQuotaActor } from './lockQuotaActor.js';
import { loadQuotaState } from './loadQuotaState.js';
import { readAdminQuota } from './readAdminQuota.js';
import { readFamilyQuota } from './readFamilyQuota.js';
import { applyScanGrants } from './applyScanGrants.js';
import { QuotaRejection } from './quotaRejection.js';
import type { QuotaState, QuotaTx } from './quotaTypes.js';
async function mutate(
  db: Database,
  month: string,
  expectedVersion: number,
  actorId: string,
  context: ScanQuotaContext,
  defaults: ScanQuotaDefaults,
  work: (tx: QuotaTx, state: QuotaState, lockedContext: ScanQuotaContext) => Promise<ScanQuotaContext | void>,
): Promise<ScanQuotaOutcome> {
  try {
    return await db.transaction(async (tx) => {
      if (month !== budgetMonth(context.now)) throw new QuotaRejection('ERR_SCAN_QUOTA_CONFLICT');
      await lockQuotaActor(tx, actorId);
      const state = await loadQuotaState(tx, month, defaults, true);
      if (state.version !== expectedVersion || state.version === Number.MAX_SAFE_INTEGER)
        throw new QuotaRejection('ERR_SCAN_QUOTA_CONFLICT');
      const lockedContext = { ...context, now: context.recheckNow?.() ?? context.now };
      if (month !== budgetMonth(lockedContext.now)) throw new QuotaRejection('ERR_SCAN_QUOTA_CONFLICT');
      const finalContext = (await work(tx, state, lockedContext)) ?? lockedContext;
      await tx.execute(sql`UPDATE scan_quota_policy SET version=version+1 WHERE id=1`);
      return { ok: true as const, view: await readAdminQuota(tx, finalContext, defaults) };
    });
  } catch (error) {
    if (error instanceof QuotaRejection) return { ok: false, code: error.code };
    throw error;
  }
}
export function createScanQuotaRepository(
  db: Database,
  defaults: ScanQuotaDefaults,
  boss?: PgBoss,
): ScanQuotaRepository {
  return {
    readAdmin: (context) =>
      db.transaction((tx) => readAdminQuota(tx, context, defaults), {
        isolationLevel: 'repeatable read',
        accessMode: 'read only',
      }),
    readFamily: (familyId, now) => readFamilyQuota(db, familyId, now, defaults.monthlyScans),
    grant: (request, actorId, context) =>
      mutate(
        db,
        request.month,
        request.expectedVersion,
        actorId,
        context,
        defaults,
        async (tx, state, lockedContext) => {
          const finalContext = await applyScanGrants(tx, request, actorId, lockedContext, state, defaults);
          if (boss)
            await requestScanQuotaRequeue(
              tx,
              boss,
              request.grants.map((grant) => grant.familyId),
            );
          return finalContext;
        },
      ),
  };
}
