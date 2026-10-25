import type { PrivacyDocument } from './PrivacyDocument.js';
export function isPrivacyImageKey(doc: PrivacyDocument): boolean {
  const prefix = `families/${doc.familyId}/profiles/${doc.healthProfileId}/documents/${doc.id}/ocr/${doc.privacyDraftId}/`;
  if (!doc.ocrImageKey?.startsWith(prefix)) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/.test(
    doc.ocrImageKey.slice(prefix.length),
  );
}
