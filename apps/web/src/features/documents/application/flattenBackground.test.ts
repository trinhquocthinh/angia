import { describe, expect, it } from 'vitest';
import { flattenBackground } from './flattenBackground';
import type { RgbaImage } from './scanTypes';

const median = (values: number[]) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]!;

describe('Làm sạch nền ảnh nắn (SPEC-084)', () => {
  it('TC-913: nền xám có vệt bóng thành gần trắng, nét chữ tối vẫn tối', () => {
    const width = 400;
    const height = 300;
    const data = new Uint8ClampedArray(width * height * 4);
    const isText = (x: number, y: number) => y % 30 >= 14 && y % 30 < 16 && x > 40 && x < 360;
    for (let y = 0; y < height; y += 1)
      for (let x = 0; x < width; x += 1) {
        // Giấy 200, vệt bóng 120 ở 1/3 bên trái, nét chữ 20 dày 2 px.
        const value = isText(x, y) ? 20 : x < width / 3 ? 120 : 200;
        data.set([value, value, value, 255], (y * width + x) * 4);
      }
    const out = flattenBackground({ width, height, data } satisfies RgbaImage);
    const background: number[] = [];
    const text: number[] = [];
    for (let y = 0; y < height; y += 1)
      for (let x = 0; x < width; x += 1)
        (isText(x, y) ? text : background).push(out.data[(y * width + x) * 4]!);
    expect(median(background)).toBeGreaterThanOrEqual(240);
    expect(median(text)).toBeLessThanOrEqual(100);
    expect(out.data[3]).toBe(255);
    expect([out.width, out.height]).toEqual([width, height]);
  });
});
