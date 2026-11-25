// ECharts cần số pixel thực; token rem vẫn theo cỡ chữ của trình duyệt.
export function readTextSize(role: 'body' | 'caption'): number {
  const fallback = role === 'body' ? 16 : 14;
  if (typeof document === 'undefined') return fallback;
  const style = getComputedStyle(document.documentElement);
  const value = style.getPropertyValue(`--font-${role}`).trim();
  const size = Number.parseFloat(value);
  if (!Number.isFinite(size)) return fallback;
  return value.endsWith('rem') ? size * Number.parseFloat(style.fontSize) : size;
}
