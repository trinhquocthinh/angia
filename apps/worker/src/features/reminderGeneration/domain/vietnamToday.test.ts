import { describe, expect, it } from 'vitest';
import { vietnamToday } from './vietnamToday.js';

describe('vietnamToday', () => {
  it('đổi ngày theo giờ Việt Nam (UTC+7), không theo UTC', () => {
    expect(vietnamToday(new Date('2026-10-22T16:59:59Z'))).toBe('2026-10-22');
    expect(vietnamToday(new Date('2026-10-22T17:05:00Z'))).toBe('2026-10-23');
  });
});
