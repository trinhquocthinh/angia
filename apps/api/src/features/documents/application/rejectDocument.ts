import type { DocumentStatus, SourceDocument } from '../domain/SourceDocument.js';
import type { ReviewRepository } from './reviewPorts.js';

type RejectOutcome =
  { ok: true; value: SourceDocument } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_INVALID_STATE_TRANSITION' };

// BR §3.1: chỉ chứng từ chờ duyệt hoặc chờ nhập tay được loại bỏ; ảnh gốc và bản trích xuất giữ nguyên.
const REJECTABLE: readonly DocumentStatus[] = ['pending_review', 'manual_entry'];

export function rejectDocument(
  repository: ReviewRepository,
  familyId: string,
  documentId: string,
): Promise<RejectOutcome> {
  return repository.withFamily(familyId, async (store) => {
    const document = await store.findDocument(documentId, { lock: true });
    if (!document) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (!REJECTABLE.includes(document.status)) return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    return { ok: true, value: await store.markRejected(document.id, REJECTABLE) };
  });
}
