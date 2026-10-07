import type { ObjectReader, ReviewRepository, StoredObject } from './reviewPorts.js';

type ImageOutcome = { ok: true; value: StoredObject } | { ok: false; code: 'ERR_NOT_FOUND' };

// Ảnh chỉ đọc qua API sau khi xác nhận chứng từ thuộc gia đình của phiên (Tech Spec §4).
// `preview` dùng ảnh WebP khi đã có (E3-S2-T1), chưa có thì trả ảnh gốc.
export async function openDocumentImage(
  repository: ReviewRepository,
  reader: ObjectReader,
  request: { familyId: string; documentId: string; variant: 'preview' | 'original' },
): Promise<ImageOutcome> {
  const document = await repository.withFamily(request.familyId, (store) =>
    store.findDocument(request.documentId),
  );
  if (!document) return { ok: false, code: 'ERR_NOT_FOUND' };
  const key =
    request.variant === 'preview' ? (document.previewKey ?? document.originalKey) : document.originalKey;
  const object = await reader.get(key);
  if (!object) return { ok: false, code: 'ERR_NOT_FOUND' };
  const contentType = key === document.originalKey ? document.mimeType : object.contentType;
  return { ok: true, value: { body: object.body, contentType } };
}
