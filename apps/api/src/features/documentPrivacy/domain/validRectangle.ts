import type { Rectangle } from './privacyEdits.js';
export function validRectangle(rect: Rectangle): boolean {
  return (
    Object.values(rect).every(Number.isInteger) &&
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left + rect.width <= 1_000_000 &&
    rect.top + rect.height <= 1_000_000
  );
}
