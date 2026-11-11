import { type Quad, SCAN_MAX_SIDE } from './scanTypes';

const length = (a: Quad[number], b: Quad[number]) => Math.hypot(b.x - a.x, b.y - a.y);

/** SPEC-084: rộng/cao lấy cạnh dài hơn của cặp cạnh đối; thu đều để cạnh dài ≤ maxSide, không phóng to. */
export function scanTargetSize([tl, tr, br, bl]: Quad, maxSide = SCAN_MAX_SIDE) {
  const width = Math.max(length(tl, tr), length(bl, br));
  const height = Math.max(length(tl, bl), length(tr, br));
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
