import { canStartExtraction } from '../domain/canStartExtraction.js';
import type { ExtractionDependencies } from './ports.js';
import { toBudgetCall } from './toBudgetCall.js';

interface DeadExtractionJob {
  documentId: string;
  familyId: string;
}
export type DeadExtractionOutcome = { status: 'skipped' } | { status: 'manual_entry' };

// Nợ #20/F08a: pg-boss chỉ chép sang dead-letter khi job hết lượt hoặc quá hạn ở lần thử cuối (worker chết/treo),
// nên chứng từ còn `extracting` không còn job nào xử lý. Chuyển manual_entry theo FSM và trả chỗ giữ ngân sách;
// chứng từ đã sang trạng thái khác thì giữ nguyên. Chạy lặp an toàn.
export async function recoverDeadExtraction(
  deps: Pick<ExtractionDependencies, 'repository' | 'budget'>,
  job: DeadExtractionJob,
): Promise<DeadExtractionOutcome> {
  const call = toBudgetCall(deps.budget);
  return deps.repository.withFamily(job.familyId, async (store) => {
    const found = await store.findDocument(job.documentId);
    if (!found || !canStartExtraction(found.status)) return { status: 'skipped' } as const;
    await store.markManualEntry(found.id);
    await store.settleBudget(found.id, 0, call);
    return { status: 'manual_entry' } as const;
  });
}
