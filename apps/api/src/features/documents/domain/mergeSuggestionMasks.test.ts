import { describe, expect, it } from 'vitest';
import { mergeSuggestionMasks } from './mergeSuggestionMasks.js';
import { toSuggestionRect } from './toSuggestionRect.js';

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height });

describe('Gộp khung gợi ý vùng che (SPEC-083 §4.1)', () => {
  it('TC-884: hai khung cùng dòng cách nhau 1% bề rộng thì gộp thành một khung bao cả hai', () => {
    expect(
      mergeSuggestionMasks([rect(100_000, 50_000, 200_000, 30_000), rect(310_000, 52_000, 100_000, 30_000)]),
    ).toEqual([rect(100_000, 50_000, 310_000, 32_000)]);
  });

  it('TC-885: khác dòng không giao nhau giữ hai khung; khác dòng nhưng giao nhau thì gộp', () => {
    const apart = [rect(100_000, 300_000, 100_000, 20_000), rect(100_000, 100_000, 100_000, 20_000)];
    expect(mergeSuggestionMasks(apart)).toEqual([apart[1], apart[0]]);
    const crossing = [rect(100_000, 100_000, 100_000, 100_000), rect(150_000, 180_000, 100_000, 100_000)];
    expect(mergeSuggestionMasks(crossing)).toEqual([rect(100_000, 100_000, 150_000, 180_000)]);
  });

  it('TC-885: cùng dòng nhưng cách xa hơn 2% bề rộng thì không gộp; gộp lan truyền tới khi ổn định', () => {
    const far = [rect(0, 0, 100_000, 20_000), rect(130_000, 0, 100_000, 20_000)];
    expect(mergeSuggestionMasks(far)).toHaveLength(2);
    const chain = [
      rect(0, 0, 100_000, 20_000),
      rect(230_000, 0, 100_000, 20_000),
      rect(115_000, 0, 100_000, 20_000),
    ];
    expect(mergeSuggestionMasks(chain)).toEqual([rect(0, 0, 330_000, 20_000)]);
    // Khung đầu chỉ chạm khung sau khi hai khung cuối đã gộp lại với nhau.
    const late = [
      rect(400_000, 0, 50_000, 20_000),
      rect(0, 0, 100_000, 20_000),
      rect(115_000, 0, 270_000, 20_000),
    ];
    expect(mergeSuggestionMasks(late)).toEqual([rect(0, 0, 450_000, 20_000)]);
  });
});

describe('Đổi bbox ocr-mask sang khung che (SPEC-083)', () => {
  it('TC-886: nới 4.000 đơn vị mỗi cạnh và kẹp trong ảnh khi sát mép', () => {
    expect(toSuggestionRect([0.1, 0.2, 0.3, 0.25])).toEqual(rect(96_000, 196_000, 208_000, 58_000));
    expect(toSuggestionRect([0, 0, 1, 1])).toEqual(rect(0, 0, 1_000_000, 1_000_000));
    const edge = toSuggestionRect([0.999, 0.5, 1, 0.6]);
    expect(edge.left + edge.width).toBe(1_000_000);
    expect(edge.width).toBeGreaterThan(0);
  });
});
