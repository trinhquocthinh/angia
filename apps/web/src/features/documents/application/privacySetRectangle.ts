import type { PrivacyRectangle } from '@angia/contracts';
const scale = 1_000_000;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function privacySetRectangle(
  rect: PrivacyRectangle,
  field: keyof PrivacyRectangle,
  value: number,
): PrivacyRectangle {
  if (!Number.isFinite(value)) return rect;
  const maximum = {
    left: scale - rect.width,
    top: scale - rect.height,
    width: scale - rect.left,
    height: scale - rect.top,
  };
  return {
    ...rect,
    [field]: clamp(Math.round(value), field === 'width' || field === 'height' ? 1 : 0, maximum[field]),
  };
}
