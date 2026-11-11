import type { Point, Quad } from './scanTypes';

/**
 * Phép chiếu từ hình vuông đơn vị (u: trái→phải, v: trên→dưới) sang tứ giác: (0,0)→trên-trái,
 * (1,0)→trên-phải, (1,1)→dưới-phải, (0,1)→dưới-trái. Công thức đóng square-to-quad (Heckbert 1989).
 */
export function quadHomography([p0, p1, p2, p3]: Quad): (u: number, v: number) => Point {
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  const det = dx1 * dy2 - dx2 * dy1;
  // Hình bình hành (dx3 = dy3 = 0) cho g = h = 0: phép affine.
  const g = det ? (dx3 * dy2 - dx2 * dy3) / det : 0;
  const h = det ? (dx1 * dy3 - dx3 * dy1) / det : 0;
  const a = p1.x - p0.x + g * p1.x;
  const b = p3.x - p0.x + h * p3.x;
  const d = p1.y - p0.y + g * p1.y;
  const e = p3.y - p0.y + h * p3.y;
  return (u, v) => {
    const w = g * u + h * v + 1;
    return { x: (a * u + b * v + p0.x) / w, y: (d * u + e * v + p0.y) / w };
  };
}
