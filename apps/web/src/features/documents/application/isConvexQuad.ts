import type { Point, Quad } from './scanTypes';

const MIN_EDGE_RATIO = 0.05;

const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** SPEC-084: 4 góc phải tạo tứ giác lồi (mọi góc quay cùng chiều) và mỗi cạnh ≥ 5% cạnh ngắn của ảnh. */
export function isConvexQuad(quad: Quad, size: { width: number; height: number }): boolean {
  const minEdge = MIN_EDGE_RATIO * Math.min(size.width, size.height);
  let sign = 0;
  for (let i = 0; i < 4; i += 1) {
    const [a, b, c] = [quad[i]!, quad[(i + 1) % 4]!, quad[(i + 2) % 4]!];
    if (Math.hypot(b.x - a.x, b.y - a.y) < minEdge) return false;
    const turn = Math.sign(cross(a, b, c));
    if (turn === 0 || (sign !== 0 && turn !== sign)) return false;
    sign = turn;
  }
  return true;
}
