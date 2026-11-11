import { describe, expect, it } from 'vitest';
import { planSuggestionImage } from './planSuggestionImage';

describe('Ảnh gửi đi gợi ý vùng che (SPEC-083)', () => {
  it('TC-892: giữ rotation, toàn ảnh, không che, cạnh dài ≤ 2048', () => {
    const plan = planSuggestionImage({ width: 4000, height: 3000 }, 90);
    expect(plan.rotation).toBe(90);
    expect(plan.rotated).toEqual({ width: 3000, height: 4000 });
    expect(plan.crop).toEqual({ left: 0, top: 0, width: 3000, height: 4000 });
    expect(plan.masks).toEqual([]);
    expect(Math.floor(4000 * plan.scale)).toBeLessThanOrEqual(2048);
    expect(Math.floor(4000 * plan.scale)).toBeGreaterThanOrEqual(2047);
  });

  it('ảnh nhỏ không phóng to', () => {
    expect(planSuggestionImage({ width: 800, height: 600 }, 0).scale).toBe(1);
  });
});
