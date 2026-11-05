import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { ObjectReader, ReviewRepository, StoredObject } from './reviewPorts.js';

// Migration 0033 giữ PNG OCR đã duyệt; upload mới vẫn chỉ nhận JPEG.
const UUID = '[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}';
const LEGACY_OCR_PNG = new RegExp(
  `^families/${UUID}/(?:documents/${UUID}/ocr\\.png|profiles/${UUID}/documents/${UUID}/ocr/${UUID}/${UUID}\\.png)$`,
);

type ImageOutcome =
  { ok: true; value: StoredObject } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

export async function openDocumentImage(
  repository: ReviewRepository,
  reader: ObjectReader,
  request: { familyId: string; documentId: string },
): Promise<ImageOutcome> {
  const document = await repository.withFamily(request.familyId, (store) =>
    store.findDocument(request.documentId),
  );
  const blocked = consentGate(document?.profileConsentStatus ?? null);
  if (blocked || !document) return { ok: false, code: blocked ?? 'ERR_NOT_FOUND' };
  if (!document.imageKey) return { ok: false, code: 'ERR_NOT_FOUND' };
  const object = await reader.get(document.imageKey);
  if (!object) return { ok: false, code: 'ERR_NOT_FOUND' };
  const contentType = LEGACY_OCR_PNG.test(document.imageKey) ? 'image/png' : 'image/jpeg';
  return { ok: true, value: { body: object.body, contentType } };
}
