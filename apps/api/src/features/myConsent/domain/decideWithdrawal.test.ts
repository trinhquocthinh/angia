import { describe, expect, it } from 'vitest';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import { decideWithdrawal } from './decideWithdrawal.js';

const profile = (consentStatus: ConsentStatus) => ({ id: 'p1', consentStatus });

describe('decideWithdrawal', () => {
  it('TC-377: tài khoản không liên kết hồ sơ thì ERR_NOT_FOUND', () => {
    expect(decideWithdrawal({ linkedProfileId: null, profile: profile('confirmed') })).toBe('ERR_NOT_FOUND');
  });
  it('TC-377: liên kết nhưng không thấy hồ sơ (khác gia đình hoặc đã xóa) thì ERR_NOT_FOUND', () => {
    expect(decideWithdrawal({ linkedProfileId: 'p1', profile: null })).toBe('ERR_NOT_FOUND');
  });
  it('TC-377: hồ sơ đã đồng thuận thì được rút', () => {
    expect(decideWithdrawal({ linkedProfileId: 'p1', profile: profile('confirmed') })).toBe('withdraw');
  });
  it.each(['pending', 'invited', 'declined', 'withdrawn'] as const)(
    'TC-377: trạng thái %s thì ERR_CONSENT_NOT_CONFIRMED',
    (status) => {
      expect(decideWithdrawal({ linkedProfileId: 'p1', profile: profile(status) })).toBe(
        'ERR_CONSENT_NOT_CONFIRMED',
      );
    },
  );
});
