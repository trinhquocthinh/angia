import { describe, expect, it } from 'vitest';
import { isConvexQuad } from './isConvexQuad';
import type { Quad } from './scanTypes';

const size = { width: 1000, height: 800 };
const quad = (...points: [number, number][]) => points.map(([x, y]) => ({ x, y })) as unknown as Quad;

describe('Kiểm 4 góc nắn giấy (SPEC-084)', () => {
  it('TC-912: chỉ tứ giác lồi, không cắt chéo, cạnh ≥ 5% cạnh ngắn là hợp lệ', () => {
    expect(isConvexQuad(quad([100, 80], [900, 120], [850, 700], [150, 760]), size)).toBe(true);
    expect(isConvexQuad(quad([0, 0], [1000, 0], [1000, 800], [0, 800]), size)).toBe(true);
    // Tự cắt chéo: đổi thứ tự hai góc dưới.
    expect(isConvexQuad(quad([100, 80], [900, 120], [150, 760], [850, 700]), size)).toBe(false);
    // Lõm: góc dưới phải kéo vào trong.
    expect(isConvexQuad(quad([100, 80], [900, 120], [300, 200], [150, 760]), size)).toBe(false);
    // Cạnh trên 30 px < 5% × 800 = 40 px.
    expect(isConvexQuad(quad([100, 80], [130, 80], [850, 700], [150, 760]), size)).toBe(false);
  });
});
