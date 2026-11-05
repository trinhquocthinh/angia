import { describe, expect, it } from 'vitest';
import type { PrivacyEdits } from '@angia/contracts';
import { scaleRect } from '@src/shared/utils/image/scaleRect';
import { planRedaction } from './planRedaction';

const FULL = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };
const edits = (overrides: Partial<PrivacyEdits>): PrivacyEdits => ({
  rotation: 0,
  crop: FULL,
  masks: [],
  ...overrides,
});

describe('Tính hình học che ảnh trên máy (E11-S3-T1)', () => {
  it('TC-424 ảnh 1000×500 xoay 90: tọa độ map trên ảnh đã xoay, vùng che +1 pixel kẹp biên', () => {
    const plan = planRedaction(
      { width: 1000, height: 500 },
      edits({ rotation: 90, masks: [{ left: 0, top: 0, width: 500_000, height: 500_000 }] }),
    );
    expect(plan.rotation).toBe(90);
    expect(plan.rotated).toEqual({ width: 500, height: 1000 });
    expect(plan.masks).toEqual([{ left: 0, top: 0, width: 251, height: 501 }]);
    expect(plan.crop).toEqual({ left: 0, top: 0, width: 500, height: 1000 });
    expect(plan.scale).toBe(1);
  });

  it('TC-425 vùng che sát mép phải/dưới không vượt ảnh đã xoay; đủ 32 vùng đều được map', () => {
    const corner = { left: 900_000, top: 900_000, width: 100_000, height: 100_000 };
    const plan = planRedaction({ width: 333, height: 777 }, edits({ masks: Array(32).fill(corner) }));
    expect(plan.masks).toHaveLength(32);
    for (const mask of plan.masks) {
      expect(mask.left + mask.width).toBe(333);
      expect(mask.top + mask.height).toBe(777);
      expect(mask.left).toBe(Math.floor(0.9 * 333) - 1);
    }
  });

  it('TC-426 ảnh 8000×6000 thu nhỏ về ≤ 13.000.000 pixel, vùng che sau khi nhân scale vẫn phủ ô ban đầu', () => {
    const mask = { left: 123_457, top: 654_321, width: 10_001, height: 20_003 };
    const plan = planRedaction({ width: 8000, height: 6000 }, edits({ masks: [mask] }));
    expect(plan.scale).toBeCloseTo(Math.sqrt(13_000_000 / 48_000_000), 10);
    expect(plan.scale).toBeCloseTo(0.5204, 4);
    const [pixel] = plan.masks;
    const scaled = scaleRect(pixel!, plan.crop, plan.scale);
    expect(scaled.left).toBeLessThanOrEqual(pixel!.left * plan.scale);
    expect(scaled.top).toBeLessThanOrEqual(pixel!.top * plan.scale);
    expect(scaled.left + scaled.width).toBeGreaterThanOrEqual((pixel!.left + pixel!.width) * plan.scale);
    expect(scaled.top + scaled.height).toBeGreaterThanOrEqual((pixel!.top + pixel!.height) * plan.scale);
  });

  it('TC-426 vùng che map theo góc cắt: trừ gốc cắt trước khi nhân scale', () => {
    const scaled = scaleRect(
      { left: 150, top: 250, width: 10, height: 10 },
      { left: 100, top: 200, width: 400, height: 400 },
      0.5,
    );
    expect(scaled).toEqual({ left: 25, top: 25, width: 5, height: 5 });
  });

  it('cắt nhỏ dưới 13.000.000 pixel thì giữ nguyên độ phân giải', () => {
    const crop = { left: 250_000, top: 250_000, width: 500_000, height: 500_000 };
    const plan = planRedaction({ width: 8000, height: 6000 }, edits({ crop }));
    expect(plan.crop).toEqual({ left: 2000, top: 1500, width: 4000, height: 3000 });
    expect(plan.scale).toBe(1);
  });
});
