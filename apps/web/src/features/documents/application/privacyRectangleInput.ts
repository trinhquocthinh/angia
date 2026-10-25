import type { PrivacyRectangle } from '@angia/contracts';
const scale = 1_000_000;
export function privacyRectangleInput(
  rectangle: PrivacyRectangle,
  field: keyof PrivacyRectangle,
  text: string,
  kind: 'crop' | 'mask',
): PrivacyRectangle | null {
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) return null;
  const value = Math.round(Number(text.replace(',', '.')) * 10000);
  if (!Number.isSafeInteger(value) || value < 0 || value > scale) return null;
  const next = { ...rectangle, [field]: value };
  if (kind === 'crop' && field === 'left') next.width = Math.min(next.width, scale - next.left);
  if (kind === 'crop' && field === 'top') next.height = Math.min(next.height, scale - next.top);
  return next.width > 0 &&
    next.height > 0 &&
    next.left + next.width <= scale &&
    next.top + next.height <= scale
    ? next
    : null;
}
