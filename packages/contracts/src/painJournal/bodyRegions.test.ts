import { describe, expect, it } from 'vitest';
import { bodyRegions } from './bodyRegions.js';
import snapshot from './bodyRegions.v1.json' with { type: 'json' };
import { bodyLocationSchema } from './schemas.js';

describe('Danh mục vùng cơ thể v1', () => {
  it('TC-655: nhận đúng vùng và bên hợp lệ', () => {
    for (const value of [
      { region: 'knee', side: 'left' },
      { region: 'neck', side: 'center' },
    ]) {
      expect(bodyLocationSchema.parse(value)).toEqual(value);
    }
  });
  it('TC-656: báo đúng trường bên khi không khớp vùng', () => {
    for (const value of [
      { region: 'lower_back', side: 'left' },
      { region: 'knee', side: 'center' },
    ]) {
      const result = bodyLocationSchema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues.map((issue) => issue.path)).toEqual([['side']]);
    }
  });
  it('TC-657: từ chối mã vùng không có trong danh mục', () => {
    for (const region of ['finger', '', 'Knee']) {
      const result = bodyLocationSchema.safeParse({ region, side: 'left' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues.map((issue) => issue.path)).toEqual([['region']]);
    }
  });
  it('TC-658: đủ 21 mã duy nhất và 35 vị trí có nhãn', () => {
    const entries = Object.entries(bodyRegions);
    expect(entries).toHaveLength(21);
    expect(new Set(entries.map(([code]) => code)).size).toBe(21);
    expect(entries.filter(([, value]) => value.sides.some((side) => side === 'center'))).toHaveLength(7);
    expect(
      entries.filter(
        ([, value]) =>
          value.sides.some((side) => side === 'left') && value.sides.some((side) => side === 'right'),
      ),
    ).toHaveLength(14);
    expect(entries.flatMap(([, value]) => value.sides)).toHaveLength(35);
    for (const [region, { label, sides }] of entries) {
      expect(label.trim().length).toBeGreaterThan(0);
      expect(sides.length).toBeGreaterThan(0);
      for (const side of sides) expect(bodyLocationSchema.safeParse({ region, side }).success).toBe(true);
    }
  });
  it('TC-659: giữ nguyên nhãn và mọi bên đã phát hành ở v1', () => {
    for (const [code, value] of Object.entries(snapshot)) {
      expect(bodyRegions).toHaveProperty(code);
      const current = bodyRegions[code as keyof typeof bodyRegions];
      expect(current.label).toBe(value.label);
      expect(current.sides).toEqual(expect.arrayContaining(value.sides));
    }
  });
});
