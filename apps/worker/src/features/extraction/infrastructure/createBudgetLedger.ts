import { budgetMonth } from '@angia/contracts';
import type pg from 'pg';
import type { BudgetCall, ExtractionStore } from '../application/ports.js';
import { OcrGateBlockedError } from '../application/OcrGateBlockedError.js';
import { assertOcrMoneyGate } from './readOcrMoneyGate.js';
import { lockScanRuntime } from './scanRuntimeLocks.js';
import { reserveScanOperation } from './reserveScanOperation.js';

// Tên port giữ tương thích nội bộ; CP5.4 chỉ giữ/trả LƯỢT, không ghi sổ tiền gia đình/hóa đơn ước tính.
export function createBudgetLedger(
  client: pg.PoolClient,
  familyId: string,
  now: () => Date = () => new Date(),
): Pick<ExtractionStore, 'reserveBudget' | 'settleBudget' | 'dispatchBudget'> {
  const check = async (call: BudgetCall) => {
    const checkedAt = now();
    if (budgetMonth(checkedAt) !== call.month) throw new OcrGateBlockedError('billing_unavailable');
    await assertOcrMoneyGate(client, call.month, call.defaultMonthlyCapUsd, checkedAt);
  };
  return {
    reserveBudget: async (id, call) => {
      const existing = await lockScanRuntime(client, familyId, id, call);
      await check(call);
      return reserveScanOperation(client, familyId, id, call.month, existing);
    },
    dispatchBudget: async (id, call) => {
      const operation = await lockScanRuntime(client, familyId, id, call);
      if (!operation || operation.state === 'released') throw new OcrGateBlockedError('scan_quota_exhausted');
      if (operation.dispatch_attempts >= 6) throw new OcrGateBlockedError('dispatch_limit');
      await check(call);
      if (operation.state === 'held') {
        if (operation.month !== call.month) throw new OcrGateBlockedError('billing_unavailable');
        const consumed = await client.query(
          `UPDATE family_scan_quotas SET held_scans=held_scans-1,used_scans=used_scans+1
          WHERE family_id=$1 AND month=$2 AND held_scans>0`,
          [familyId, operation.month],
        );
        if (consumed.rowCount !== 1) throw new Error('Không còn lượt giữ của operation');
        await client.query(
          `UPDATE scan_quota_months SET committed_remaining_scans=committed_remaining_scans-1
          WHERE month=$1`,
          [operation.month],
        );
      }
      await client.query(
        `UPDATE ocr_operations SET state='dispatched',dispatch_attempts=dispatch_attempts+1,
        dispatched_at=COALESCE(dispatched_at,$3) WHERE source_document_id=$1 AND family_id=$2`,
        [id, familyId, now()],
      );
    },
    settleBudget: async (id, _costUsd, call) => {
      const operation = await lockScanRuntime(client, familyId, id, call);
      if (operation?.state !== 'held') return;
      await client.query(
        'UPDATE family_scan_quotas SET held_scans=held_scans-1 WHERE family_id=$1 AND month=$2',
        [familyId, operation.month],
      );
      await client.query(
        "UPDATE ocr_operations SET state='released' WHERE source_document_id=$1 AND family_id=$2",
        [id, familyId],
      );
    },
  };
}
