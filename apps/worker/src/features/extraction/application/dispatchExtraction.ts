import { canUseApprovedOcrImage } from '../domain/canUseApprovedOcrImage.js';
import type { DocumentToExtract } from '../domain/ExtractionDocument.js';
import { OcrGuardChangedError } from './OcrGuardChangedError.js';
import type { BudgetCall, ExtractionDependencies } from './ports.js';

/** Đọc lại dưới khóa trước khi ghi lượt gửi; HTTP nằm ngoài transaction. */
export async function dispatchExtraction(
  deps: ExtractionDependencies,
  job: { documentId: string; familyId: string },
  call: BudgetCall,
  expected: DocumentToExtract,
): Promise<void> {
  await deps.repository.withFamily(job.familyId, async (store) => {
    const document = await store.findDocument(job.documentId);
    if (!document || document.status !== 'extracting') throw new OcrGuardChangedError('skipped');
    if (!document.profileConsentConfirmed) throw new OcrGuardChangedError('consent_required');
    if (
      document.ocrImageKey !== expected.ocrImageKey ||
      document.originalKey !== expected.originalKey ||
      !canUseApprovedOcrImage(document, expected.originalKey, expected.ocrImageSha256 ?? '')
    )
      throw new OcrGuardChangedError('privacy_required');
    await store.dispatchBudget(job.documentId, call);
  });
}
