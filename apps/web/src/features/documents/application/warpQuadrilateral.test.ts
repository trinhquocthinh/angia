import { describe, expect, it } from 'vitest';
import { quadHomography } from './quadHomography';
import { scanTargetSize } from './scanTargetSize';
import type { Quad, RgbaImage } from './scanTypes';
import { warpQuadrilateral } from './warpQuadrilateral';

const quad = (...points: [number, number][]) => points.map(([x, y]) => ({ x, y })) as unknown as Quad;
const image = (width: number, height: number, paint: (x: number, y: number) => number[]): RgbaImage => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) data.set(paint(x, y), (y * width + x) * 4);
  return { width, height, data };
};
const pixel = (img: RgbaImage, x: number, y: number) => [
  ...img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4),
];

describe('Nắn phối cảnh 4 góc (SPEC-084)', () => {
  it('TC-909: 4 góc là toàn ảnh → ảnh ra trùng ảnh vào (±1 mỗi kênh)', () => {
    const source = image(37, 23, (x, y) => [(x * 7) % 256, (y * 11) % 256, (x * y) % 256, 255]);
    const out = warpQuadrilateral(source, quad([0, 0], [37, 0], [37, 23], [0, 23]));
    expect([out.width, out.height]).toEqual([37, 23]);
    let worst = 0;
    for (let i = 0; i < source.data.length; i += 1)
      worst = Math.max(worst, Math.abs(source.data[i]! - out.data[i]!));
    expect(worst).toBeLessThanOrEqual(1);
  });

  it('TC-910: góc ảnh đích ứng đúng 4 góc tờ giấy; điểm mốc ở góc giấy về đúng góc ảnh', () => {
    const paper = quad([60, 40], [340, 70], [320, 260], [80, 240]);
    const map = quadHomography(paper);
    paper.forEach((corner, i) => {
      const [u, v] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ][i]!;
      const mapped = map(u!, v!);
      expect(mapped.x).toBeCloseTo(corner.x, 6);
      expect(mapped.y).toBeCloseTo(corner.y, 6);
    });
    // Mốc đỏ quanh góc trên-trái và xanh quanh góc dưới-phải của tờ giấy (trên nền trắng).
    const near = (x: number, y: number, c: { x: number; y: number }) => Math.hypot(x - c.x, y - c.y) <= 6;
    const source = image(400, 300, (x, y) =>
      near(x, y, paper[0])
        ? [255, 0, 0, 255]
        : near(x, y, paper[2])
          ? [0, 0, 255, 255]
          : [255, 255, 255, 255],
    );
    const out = warpQuadrilateral(source, paper);
    expect(pixel(out, 1, 1).slice(0, 3)).toEqual([255, 0, 0]);
    expect(pixel(out, out.width - 2, out.height - 2).slice(0, 3)).toEqual([0, 0, 255]);
    expect(pixel(out, Math.floor(out.width / 2), Math.floor(out.height / 2)).slice(0, 3)).toEqual([
      255, 255, 255,
    ]);
  });

  it('TC-911: kích thước theo cạnh dài hơn, thu về cạnh dài ≤ 3000, không phóng to', () => {
    // Cạnh bên xiên dài √(200² + 3000²) ≈ 3006,7 → × 0,75 = 2255.
    expect(scanTargetSize(quad([0, 0], [4000, 0], [3800, 3000], [200, 3000]))).toEqual({
      width: 3000,
      height: 2255,
    });
    expect(scanTargetSize(quad([0, 0], [800, 0], [800, 600], [0, 600]))).toEqual({ width: 800, height: 600 });
    expect(scanTargetSize(quad([0, 0], [600, 0], [640, 500], [-40, 500]))).toEqual({
      width: 680,
      height: 502,
    });
  });
});
