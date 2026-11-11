import { isConvexQuad } from './isConvexQuad';
import type { Point, Quad } from './scanTypes';

/** 4 góc chuẩn hoá 0..1 trên ảnh đã xoay; mặc định là toàn ảnh (chưa nắn). */
export const FULL_QUAD: Quad = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];
export const CORNER_LABELS = ['Góc trên trái', 'Góc trên phải', 'Góc dưới phải', 'Góc dưới trái'] as const;

const STEP = 0.01;
const BIG_STEP = 0.05;
const ARROWS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function setCorner(quad: Quad, index: number, point: Point): Quad {
  return quad.map((corner, i) =>
    i === index ? { x: clamp(point.x), y: clamp(point.y) } : corner,
  ) as unknown as Quad;
}

/** TC-917: mũi tên dịch 1% ảnh, Shift dịch 5%; phím khác trả null để không chặn hành vi mặc định. */
export function nudgeCorner(quad: Quad, index: number, key: string, shift: boolean): Quad | null {
  const direction = ARROWS[key];
  if (!direction) return null;
  const step = shift ? BIG_STEP : STEP;
  const corner = quad[index]!;
  return setCorner(quad, index, { x: corner.x + direction.x * step, y: corner.y + direction.y * step });
}

/** Vị trí con trỏ → toạ độ 0..1 trong khung ảnh đã xoay (hộp đo là ảnh, không gồm lề quanh ảnh). */
export function pointerToUnit(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
): Point {
  return { x: clamp((clientX - box.left) / box.width), y: clamp((clientY - box.top) / box.height) };
}

/** Kiểm tứ giác trên kích thước ảnh thật (đã xoay) để ngưỡng cạnh 5% đúng theo pixel. */
export function quadIsValid(quad: Quad, size: { width: number; height: number }): boolean {
  const pixels = quad.map((p) => ({ x: p.x * size.width, y: p.y * size.height })) as unknown as Quad;
  return isConvexQuad(pixels, size);
}
