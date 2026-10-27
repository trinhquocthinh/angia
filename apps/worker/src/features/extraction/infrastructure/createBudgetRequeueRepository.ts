import { budgetMonth, EXTRACT_DOCUMENT_QUEUE } from '@angia/contracts';
import type pg from 'pg';
import type { PgBoss } from 'pg-boss';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { OcrGateBlockedError } from '../application/OcrGateBlockedError.js';
import type { BudgetCall, BudgetRequeueRepository } from '../application/ports.js';
import { createExtractionStore } from './createExtractionStore.js';
import { assertOcrMoneyGate } from './readOcrMoneyGate.js';
import { lockScanRuntime } from './scanRuntimeLocks.js';

// Cùng khóa với worker; không đẩy lại chứng từ khi một lời gọi HTTP còn chạy.
async function requeueDocument(
  pool: pg.Pool,
  boss: PgBoss,
  familyId: string,
  documentId: string,
  call: BudgetCall,
  now: () => Date,
) {
  return withFamilyScope(pool, familyId, async (client) => {
    const lock = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_xact_lock(hashtextextended($1,0)) AS locked',
      [`angia:ocr:${familyId}:${documentId}`],
    );
    if (!lock.rows[0]?.locked) return false;
    const document = await createExtractionStore(client, familyId).findDocument(documentId);
    if (document?.status !== 'awaiting_budget') return false;
    const operation = await lockScanRuntime(client, familyId, documentId, call);
    const instant = now();
    if (budgetMonth(instant) !== call.month) throw new OcrGateBlockedError('billing_unavailable');
    await assertOcrMoneyGate(client, call.month, call.defaultMonthlyCapUsd, instant);
    if (
      operation?.state !== 'dispatched' &&
      !(operation?.state === 'held' && operation.month === call.month)
    ) {
      const quota = await client.query(
        `SELECT 1 FROM family_scan_quotas WHERE family_id=$1 AND month=$2
         AND used_scans+held_scans<granted_scans`,
        [familyId, call.month],
      );
      if (!quota.rowCount) return false;
    }
    await client.query(
      `UPDATE source_documents SET status='extracting' WHERE id=$1 AND family_id=$2 AND status='awaiting_budget'`,
      [documentId, familyId],
    );
    const db = { executeSql: (text: string, values?: unknown[]) => client.query(text, values) };
    if (!(await boss.send(EXTRACT_DOCUMENT_QUEUE, { documentId, familyId }, { db })))
      throw new Error('Không tạo được việc đọc chứng từ');
    return true;
  });
}

// Mỗi chứng từ một transaction theo thứ tự tạo; không tự cấp quota khi sang tháng mới.
export function createBudgetRequeueRepository(
  pool: pg.Pool,
  boss: PgBoss,
  now: () => Date = () => new Date(),
): BudgetRequeueRepository {
  return {
    listFamilyIds: async () =>
      (await pool.query<{ id: string }>('SELECT id FROM families ORDER BY id')).rows.map((row) => row.id),
    requeueFamily: async (familyId, call) => {
      const ids = await withFamilyScope(pool, familyId, async (client) =>
        (
          await client.query<{ id: string }>(
            `SELECT id FROM source_documents WHERE family_id=$1 AND status='awaiting_budget' ORDER BY created_at,id`,
            [familyId],
          )
        ).rows.map((row) => row.id),
      );
      let requeued = 0;
      for (const id of ids) {
        try {
          if (await requeueDocument(pool, boss, familyId, id, call, now)) requeued += 1;
        } catch (error) {
          if (!(error instanceof OcrGateBlockedError)) throw error;
          return requeued;
        }
      }
      return requeued;
    },
  };
}
