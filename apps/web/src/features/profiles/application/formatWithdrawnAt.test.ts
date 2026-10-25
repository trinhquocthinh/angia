import { describe, expect, it } from 'vitest';
import { formatWithdrawnAt } from './formatWithdrawnAt';
describe('TC-385 — giờ rút đồng thuận theo giờ Việt Nam', () => {
  it('định dạng "HH:mm, dd/MM/yyyy" ở múi giờ Asia/Ho_Chi_Minh', () => {
    expect(formatWithdrawnAt('2026-10-24T03:05:00Z')).toBe('10:05, 24/10/2026');
    expect(formatWithdrawnAt('2026-12-31T20:30:00Z')).toBe('03:30, 01/01/2027');
  });
});
