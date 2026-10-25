import { describe, expect, it } from 'vitest';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import { checkDeliveryEligibility } from './checkDeliveryEligibility.js';

const PROFILE = '0199a000-0000-7000-8000-000000000001';
const MAIN = '0199b000-0000-7000-8000-000000000001';
const OTHER = '0199b000-0000-7000-8000-000000000002';
const mains: FamilyAccount[] = [
  { id: MAIN, role: 'main', healthProfileId: null },
  { id: OTHER, role: 'main', healthProfileId: null },
];
const base = {
  deviceAccountId: MAIN,
  profileId: PROFILE,
  consentConfirmed: true,
  familyAccounts: mains,
  assignedAccountIds: [MAIN],
};

describe('checkDeliveryEligibility — kiểm lại đích ngay trước khi gửi (BR-039)', () => {
  it('thiết bị đã bị gỡ (không còn tài khoản) → revoked_device', () => {
    expect(checkDeliveryEligibility({ ...base, deviceAccountId: null })).toBe('revoked_device');
  });

  it('hồ sơ không còn đồng thuận → revoked_consent', () => {
    expect(checkDeliveryEligibility({ ...base, consentConfirmed: false })).toBe('revoked_consent');
  });

  it('TC-381: hồ sơ đã rút đồng thuận (consentConfirmed=false) → revoked_consent, không gửi nữa', () => {
    expect(checkDeliveryEligibility({ ...base, consentConfirmed: false })).toBe('revoked_consent');
  });

  it('hồ sơ đã liên kết với tài khoản khác → revoked_recipient', () => {
    const accounts: FamilyAccount[] = [mains[0]!, { id: OTHER, role: 'member', healthProfileId: PROFILE }];
    expect(checkDeliveryEligibility({ ...base, familyAccounts: accounts })).toBe('revoked_recipient');
  });

  it('người được chỉ định đã bị hạ xuống member → revoked_recipient', () => {
    const accounts: FamilyAccount[] = [{ id: MAIN, role: 'member', healthProfileId: null }];
    expect(checkDeliveryEligibility({ ...base, familyAccounts: accounts })).toBe('revoked_recipient');
  });

  it('thiết bị của người nhận hợp lệ hiện hành → ok', () => {
    expect(checkDeliveryEligibility(base)).toBe('ok');
  });
});
