import type { PrivacyRectangle } from '@angia/contracts';
import type { PrivacyPoint } from './privacyPoint';
export function privacyDragRectangle(a: PrivacyPoint, b: PrivacyPoint): PrivacyRectangle | null {
  const width = Math.abs(a.x - b.x);
  const height = Math.abs(a.y - b.y);
  return width && height ? { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), width, height } : null;
}
