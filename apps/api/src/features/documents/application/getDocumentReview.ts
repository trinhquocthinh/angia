import type { SourceDocument } from '../domain/SourceDocument.js';
import type { ReviewRepository } from './reviewPorts.js';

type ReviewOutcome =
  | { ok: true; value: { document: SourceDocument; extraction: unknown } }
  | { ok: false; code: 'ERR_NOT_FOUND' };

// Chứng từ + payload trích xuất mới nhất để điền sẵn form đối soát (SPEC-010).
export async function getDocumentReview(
  repository: ReviewRepository,
  familyId: string,
  documentId: string,
): Promise<ReviewOutcome> {
  return repository.withFamily(familyId, async (store) => {
    const document = await store.findDocument(documentId);
    if (!document) return { ok: false, code: 'ERR_NOT_FOUND' };
    return { ok: true, value: { document, extraction: await store.findLatestExtraction(documentId) } };
  });
}
