import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { SourceDocument } from '../domain/SourceDocument.js';
import type { ObjectReader, ReviewRepository, StoredObject } from './reviewPorts.js';

type ImageOutcome =
  { ok: true; value: StoredObject } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// Ảnh chỉ đọc qua API sau khi xác nhận chứng từ thuộc gia đình của phiên (Tech Spec §4).
// `preview` dùng ảnh WebP khi đã có (E3-S2-T1), chưa có thì trả ảnh gốc.
// `ocr` là bản đã che đã gửi AI (SPEC-028); chứng từ chưa có bản này → ERR_NOT_FOUND.
function imageKey(document: SourceDocument, variant: 'preview' | 'original' | 'ocr'): string | null {
  if (variant === 'ocr') return document.ocrImageKey;
  return variant === 'preview' ? (document.previewKey ?? document.originalKey) : document.originalKey;
}
export async function openDocumentImage(
  repository: ReviewRepository,
  reader: ObjectReader,
  request: { familyId: string; documentId: string; variant: 'preview' | 'original' | 'ocr' },
): Promise<ImageOutcome> {
  const document = await repository.withFamily(request.familyId, (store) =>
    store.findDocument(request.documentId),
  );
  const blocked = consentGate(document?.profileConsentStatus ?? null);
  if (blocked || !document) return { ok: false, code: blocked ?? 'ERR_NOT_FOUND' };
  const key = imageKey(document, request.variant);
  if (!key) return { ok: false, code: 'ERR_NOT_FOUND' };
  const object = await reader.get(key);
  if (!object) return { ok: false, code: 'ERR_NOT_FOUND' };
  const contentType = key === document.originalKey ? document.mimeType : object.contentType;
  return { ok: true, value: { body: object.body, contentType } };
}
