import type { SuggestionRect } from './SuggestionRect.js';

// Khoảng cách ngang tối đa giữa hai khung cùng dòng để gộp: 2% bề rộng ảnh.
const MAX_GAP = 20_000;

const right = (r: SuggestionRect) => r.left + r.width;
const bottom = (r: SuggestionRect) => r.top + r.height;

function mergeable(a: SuggestionRect, b: SuggestionRect): boolean {
  const overlapY = Math.min(bottom(a), bottom(b)) - Math.max(a.top, b.top);
  const gapX = Math.max(a.left, b.left) - Math.min(right(a), right(b));
  if (gapX < 0 && overlapY > 0) return true; // giao nhau
  return overlapY >= Math.min(a.height, b.height) / 2 && gapX <= MAX_GAP;
}

function union(a: SuggestionRect, b: SuggestionRect): SuggestionRect {
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  return {
    left,
    top,
    width: Math.max(right(a), right(b)) - left,
    height: Math.max(bottom(a), bottom(b)) - top,
  };
}

/** Gộp khung cùng dòng sát nhau và khung giao nhau tới khi ổn định, sắp theo top rồi left (SPEC-083 §4.1). */
export function mergeSuggestionMasks(rects: readonly SuggestionRect[]): SuggestionRect[] {
  const merged = [...rects];
  // Khung vừa gộp lớn hơn có thể chạm khung đã xét trước đó: gộp xong thì quét lại từ đầu.
  for (let pair = findPair(merged); pair; pair = findPair(merged)) {
    const [i, j] = pair;
    merged[i] = union(merged[i]!, merged.splice(j, 1)[0]!);
  }
  return merged.sort((a, b) => a.top - b.top || a.left - b.left);
}

function findPair(rects: SuggestionRect[]): [number, number] | null {
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) if (mergeable(rects[i]!, rects[j]!)) return [i, j];
  }
  return null;
}
