import type { PrivacyEdits, PrivacyRectangle } from './PrivacyEdits.js';
const SCALE = 1_000_000;
export function validatePrivacyEdits(value: unknown): asserts value is PrivacyEdits {
  if (!value || typeof value !== 'object') throw new Error('privacy_edits_invalid');
  const candidate = value as Partial<PrivacyEdits>;
  if (
    ![0, 90, 180, 270].includes(candidate.rotation ?? -1) ||
    !Array.isArray(candidate.masks) ||
    candidate.masks.length > 32
  )
    throw new Error('privacy_edits_invalid');
  if (![candidate.crop, ...candidate.masks].every(isRectangle)) throw new Error('privacy_edits_invalid');
}
function isRectangle(value: unknown): value is PrivacyRectangle {
  if (!value || typeof value !== 'object') return false;
  const rect = value as PrivacyRectangle;
  return (
    [rect.left, rect.top, rect.width, rect.height].every(Number.isSafeInteger) &&
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left + rect.width <= SCALE &&
    rect.top + rect.height <= SCALE
  );
}
