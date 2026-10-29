import { describe, expect, it } from 'vitest';
import { CHILD_AGE_LIMIT, showsVitals } from './showsVitals.js';

describe('Hiển thị huyết áp, đường huyết theo độ tuổi', () => {
  it('TC-440: mốc tuổi trẻ em là 16', () => {
    expect(CHILD_AGE_LIMIT).toBe(16);
  });

  it.each([
    [2011, null, 2026, false],
    [2011, false, 2026, false],
    [2011, true, 2026, true],
    [2010, null, 2026, true],
    [2010, false, 2026, true],
    [1980, null, 2026, true],
    [null, null, 2026, true],
    [null, false, 2026, true],
  ] as const)(
    'TC-440: năm sinh %s, công tắc %s, năm hiện tại %s → hiển thị %s',
    (birthYear, vitalsEnabled, currentYear, expected) => {
      expect(showsVitals({ birthYear, vitalsEnabled }, currentYear)).toBe(expected);
    },
  );

  it('TC-440: tự hiện lại khi sang năm đủ 16 tuổi', () => {
    const profile = { birthYear: 2011, vitalsEnabled: null };
    expect(showsVitals(profile, 2026)).toBe(false);
    expect(showsVitals(profile, 2027)).toBe(true);
  });
});
