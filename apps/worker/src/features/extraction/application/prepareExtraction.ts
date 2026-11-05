import { canUseApprovedImage } from '../domain/canUseApprovedImage.js';
import { canStartExtraction } from '../domain/canStartExtraction.js';
import { OcrGateBlockedError } from './OcrGateBlockedError.js';
import type { BudgetCall, ExtractionDependencies } from './ports.js';

export async function prepareExtraction(
  deps: ExtractionDependencies,
  job: { documentId: string; familyId: string },
  call: BudgetCall,
) {
  return await deps.repository.withFamily(job.familyId, async (store) => {
    const found = await store.findDocument(job.documentId);
    if (!found) return null;
    if (!canStartExtraction(found.status)) {
      await store.settleBudget(found.id, 0, call);
      return null;
    }
    if (!found.profileConsentConfirmed) {
      // F07: hồ sơ không còn đồng thuận → không giữ ngân sách, không đọc ảnh, không gọi AI.
      await store.markManualEntry(found.id);
      await store.settleBudget(found.id, 0, call);
      return 'consent_required' as const;
    }
    if (
      !found.imageKey?.startsWith(`families/${job.familyId}/`) ||
      !canUseApprovedImage(found, found.imageSha256 ?? '')
    ) {
      await store.markManualEntry(found.id);
      await store.settleBudget(found.id, 0, call);
      return 'privacy_required' as const;
    }
    try {
      if (!(await store.reserveBudget(found.id, call))) throw new OcrGateBlockedError('budget_exhausted');
    } catch (error) {
      if (!(error instanceof OcrGateBlockedError)) throw error;
      if (error.reason === 'dispatch_limit') await store.markManualEntry(found.id);
      else await store.markAwaitingBudget(found.id, error.reason);
      await store.settleBudget(found.id, 0, call);
      return { blocked: error.reason };
    }
    await store.markExtracting(found.id);
    return found;
  });
}
