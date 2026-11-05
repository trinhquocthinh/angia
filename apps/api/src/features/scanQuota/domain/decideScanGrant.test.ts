import { describe, expect, it } from 'vitest';
import { decideScanGrant } from './decideScanGrant.js';
describe('Duyệt tổng lượt gia đình', () => {
  it('TC-580: tổng giữ nguyên không cộng hai lần, nâng trial không làm mất used và held', () => {
    expect(decideScanGrant({ status: 'trial', grantedScans: 5 }, 8)).toEqual({ ok: true, delta: 3 });
    expect(decideScanGrant({ status: 'approved', grantedScans: 8 }, 8)).toEqual({ ok: true, delta: 0 });
    expect(decideScanGrant(null, 0)).toEqual({ ok: true, delta: 0 });
  });
  it('TC-580: không giảm tổng lượt trong cùng tháng', () => {
    expect(decideScanGrant({ status: 'approved', grantedScans: 8 }, 7)).toEqual({
      ok: false,
      code: 'ERR_SCAN_QUOTA_DECREASE',
    });
  });
});
