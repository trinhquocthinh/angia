import type { PixelPrivacyEdits, PrivacyRectangle } from './PrivacyEdits.js';
import { validatePrivacyEdits } from './validatePrivacyEdits.js';
export function mapPrivacyEdits(edits: unknown, width: number, height: number): PixelPrivacyEdits {
  validatePrivacyEdits(edits);
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > 13_000_000 / height
  )
    throw new Error('privacy_dimensions_invalid');
  return {
    crop: pixels(edits.crop, width, height, 0),
    masks: edits.masks.map((mask) => pixels(mask, width, height, 1)),
  };
}
// Vùng che mở rộng một pixel sau khi làm tròn ra ngoài, không vượt mép ảnh.
function pixels(rect: PrivacyRectangle, width: number, height: number, border: number): PrivacyRectangle {
  const left = Math.max(0, Math.floor((rect.left * width) / 1_000_000) - border);
  const top = Math.max(0, Math.floor((rect.top * height) / 1_000_000) - border);
  const right = Math.min(width, Math.ceil(((rect.left + rect.width) * width) / 1_000_000) + border);
  const bottom = Math.min(height, Math.ceil(((rect.top + rect.height) * height) / 1_000_000) + border);
  return { left, top, width: right - left, height: bottom - top };
}
