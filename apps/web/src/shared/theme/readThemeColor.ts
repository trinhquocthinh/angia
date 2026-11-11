// Canvas, ECharts và Three.js cần giá trị màu thực thay cho tham chiếu CSS.
export function readThemeColor(name: string): string {
  const property = `--color-${name}`;
  if (typeof document === 'undefined') return `var(${property})`;
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}
