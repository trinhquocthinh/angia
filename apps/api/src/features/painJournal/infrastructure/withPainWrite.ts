import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PainIssueWriteResult } from '../application/ports.js';

export async function withPainWrite<T>(
  tx: FamilyScopedTx,
  work: (savepoint: FamilyScopedTx) => Promise<T>,
  findConflict: () => Promise<string | null>,
): Promise<PainIssueWriteResult<T>> {
  try {
    return { ok: true, value: await tx.transaction(work) };
  } catch (error) {
    const outer = error as {
      code?: string;
      constraint?: string;
      cause?: { code?: string; constraint?: string };
    } | null;
    const dbError = outer?.cause ?? outer;
    if (dbError?.code !== '23505' || dbError.constraint !== 'pain_issues_tracking_region_unique') throw error;
    // Savepoint đã rollback; transaction lại đọc được ID thay vì lỗi 25P02.
    const existingIssueId = await findConflict();
    if (existingIssueId === null) throw error;
    return { ok: false, code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId } };
  }
}
