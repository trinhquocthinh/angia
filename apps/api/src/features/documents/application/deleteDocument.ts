import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { DocumentDeletionDeps } from './deletionPorts.js';

type DeleteOutcome = { ok: true } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// SPEC-037: ghi ý định xóa object cùng transaction xóa chứng từ (FK cascade bản ghi sinh ra);
// rollback không chạm S3. Sau COMMIT mới xóa object; lỗi giữ dòng object_purges cho job dọn.
export async function deleteDocument(
  deps: DocumentDeletionDeps,
  familyId: string,
  documentId: string,
): Promise<DeleteOutcome> {
  const deleted = await deps.repository.withFamily(familyId, async (store) => {
    const document = await store.findDocument(documentId, true);
    const blocked = consentGate(document?.profileConsentStatus ?? null);
    if (blocked || !document) return { ok: false as const, code: blocked ?? 'ERR_NOT_FOUND' };
    if (document.imageKey) await store.insertObjectPurge(document.imageKey);
    await store.deleteDocument(documentId);
    return { ok: true as const, imageKey: document.imageKey };
  });
  if (!deleted.ok) return deleted;
  const key = deleted.imageKey;
  if (!key) return { ok: true };
  try {
    await deps.storage.delete(key);
    await deps.repository.withFamily(familyId, (store) => store.removeObjectPurge(key));
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown';
    deps.logger.warn({ familyId, documentId, reason }, 'Chưa xóa xong ảnh của chứng từ đã xóa; chờ job dọn');
    // Enqueue lỗi vẫn còn dòng object_purges: worker khởi động sẽ enqueue lại.
    await deps.purgeQueue.enqueue().catch(() => undefined);
  }
  return { ok: true };
}
