import { describe, expect, it } from 'vitest';
import { CORNER_LABELS, FULL_QUAD, nudgeCorner, pointerToUnit, quadIsValid, setCorner } from './scanCorners';

describe('Kéo 4 góc nắn giấy (SPEC-084)', () => {
  it('mặc định là toàn ảnh; mỗi tay nắm có nhãn tiếng Việt theo thứ tự trên-trái → dưới-trái', () => {
    expect(FULL_QUAD).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    expect(CORNER_LABELS).toEqual(['Góc trên trái', 'Góc trên phải', 'Góc dưới phải', 'Góc dưới trái']);
  });

  it('TC-917: phím mũi tên dịch 1% ảnh, Shift + mũi tên dịch 5%, kẹp trong ảnh; phím khác bỏ qua', () => {
    const right = nudgeCorner(FULL_QUAD, 0, 'ArrowRight', false)!;
    expect(right[0].x).toBeCloseTo(0.01, 9);
    const down = nudgeCorner(FULL_QUAD, 0, 'ArrowDown', true)!;
    expect(down[0].y).toBeCloseTo(0.05, 9);
    expect(nudgeCorner(FULL_QUAD, 0, 'ArrowLeft', false)![0]).toEqual({ x: 0, y: 0 });
    expect(nudgeCorner(FULL_QUAD, 2, 'ArrowRight', true)![2]).toEqual({ x: 1, y: 1 });
    expect(nudgeCorner(FULL_QUAD, 0, 'Enter', false)).toBeNull();
    expect(right.slice(1)).toEqual(FULL_QUAD.slice(1));
  });

  it('vị trí con trỏ đổi sang toạ độ 0..1 trong khung ảnh, kẹp ở mép; đặt góc không đổi góc khác', () => {
    const box = { left: 100, top: 50, width: 400, height: 200 };
    expect(pointerToUnit(300, 150, box)).toEqual({ x: 0.5, y: 0.5 });
    expect(pointerToUnit(0, 999, box)).toEqual({ x: 0, y: 1 });
    expect(setCorner(FULL_QUAD, 1, { x: 0.8, y: 0.1 })).toEqual([
      FULL_QUAD[0],
      { x: 0.8, y: 0.1 },
      FULL_QUAD[2],
      FULL_QUAD[3],
    ]);
  });

  it('kiểm tứ giác theo kích thước ảnh thật (cạnh ≥ 5% cạnh ngắn)', () => {
    const size = { width: 1000, height: 800 };
    expect(quadIsValid(FULL_QUAD, size)).toBe(true);
    expect(quadIsValid(setCorner(FULL_QUAD, 1, { x: 0.02, y: 0 }), size)).toBe(false);
  });
});
