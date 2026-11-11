import { SUGGESTION_UNIT, type SuggestionRect } from './SuggestionRect.js';

// Nới mỗi cạnh 0,4% ảnh: tương đương 4 px trên ảnh ~1000 px mà ocr-mask dùng khi tự che (HL-24 §2).
const PAD = 4_000;

/** bbox [x0, y0, x1, y1] chuẩn hoá 0..1 của ocr-mask → khung đã nới, làm tròn ra ngoài và kẹp trong ảnh. */
export function toSuggestionRect([x0, y0, x1, y1]: readonly [
  number,
  number,
  number,
  number,
]): SuggestionRect {
  const left = Math.max(0, Math.floor(x0 * SUGGESTION_UNIT) - PAD);
  const top = Math.max(0, Math.floor(y0 * SUGGESTION_UNIT) - PAD);
  const right = Math.min(SUGGESTION_UNIT, Math.ceil(x1 * SUGGESTION_UNIT) + PAD);
  const bottom = Math.min(SUGGESTION_UNIT, Math.ceil(y1 * SUGGESTION_UNIT) + PAD);
  return { left, top, width: right - left, height: bottom - top };
}
