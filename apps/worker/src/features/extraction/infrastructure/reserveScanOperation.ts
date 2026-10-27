import type pg from 'pg';
import type { ScanOperation } from './scanRuntimeLocks.js';
import { OcrGateBlockedError } from '../application/OcrGateBlockedError.js';

export async function reserveScanOperation(
  client: pg.PoolClient,
  familyId: string,
  id: string,
  month: string,
  existing?: ScanOperation,
): Promise<boolean> {
  if (existing?.state === 'dispatched' || (existing?.state === 'held' && existing.month === month))
    return true;
  const held = await client.query(
    `UPDATE family_scan_quotas SET held_scans=held_scans+1
    WHERE family_id=$1 AND month=$2 AND used_scans+held_scans<granted_scans`,
    [familyId, month],
  );
  if (held.rowCount !== 1) throw new OcrGateBlockedError('scan_quota_exhausted');
  if (existing?.state === 'held')
    await client.query(
      `UPDATE family_scan_quotas SET held_scans=held_scans-1
    WHERE family_id=$1 AND month=$2`,
      [familyId, existing.month],
    );
  await client.query(
    `INSERT INTO ocr_operations(source_document_id,family_id,month,state) VALUES($1,$2,$3,'held')
    ON CONFLICT(source_document_id) DO UPDATE SET month=excluded.month,state='held'`,
    [id, familyId, month],
  );
  return true;
}
