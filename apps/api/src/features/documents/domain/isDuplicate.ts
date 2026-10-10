import type { ContentFingerprint } from './contentFingerprint.js';
import type { DocumentType } from './SourceDocument.js';

/** Nội dung một chứng từ (hoặc một lần nhập tay) đem so trùng; `time` chỉ có ở số đo. */
export interface DocumentContent {
  healthProfileId: string;
  type: DocumentType;
  date: string;
  time: string | null;
  fingerprint: ContentFingerprint;
}

// Giờ đo "nếu có": chỉ so khi cả hai bản đều ghi giờ (owner chốt 2026-10-09).
const sameTime = (a: string | null, b: string | null) => a === null || b === null || a === b;
const sameSet = (a: ContentFingerprint, b: ContentFingerprint) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

// SPEC-012/BR-017: trùng khi cùng hồ sơ, cùng loại, cùng ngày và cùng dấu vân nội dung.
export function isDuplicate(incoming: DocumentContent, saved: DocumentContent): boolean {
  return (
    incoming.healthProfileId === saved.healthProfileId &&
    incoming.type === saved.type &&
    incoming.date === saved.date &&
    sameTime(incoming.time, saved.time) &&
    sameSet(incoming.fingerprint, saved.fingerprint)
  );
}
