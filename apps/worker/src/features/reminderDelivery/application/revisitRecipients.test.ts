import { describe, expect, it } from 'vitest';
import { checkReminderDeliveryEligibility } from './checkReminderDeliveryEligibility.js';
import { resolveDeliveryRecipientAccountIds } from './resolveDeliveryRecipientAccountIds.js';

const familyAccounts = [
  { id: 'main-linked', role: 'main' as const, healthProfileId: 'profile' },
  { id: 'main2', role: 'main' as const, healthProfileId: null },
  { id: 'other', role: 'member' as const, healthProfileId: null },
];
const input = {
  deviceAccountId: 'main2',
  profileId: 'profile',
  consentConfirmed: true,
  familyAccounts,
  assignedAccountIds: [],
};

describe('Người nhận nhắc tái khám', () => {
  it('TC-477: hợp main và tài khoản liên kết không trùng, giữ quy tắc thuốc cho hồ sơ liên kết', () => {
    expect(resolveDeliveryRecipientAccountIds('revisit', 'profile', familyAccounts, ['other'])).toEqual([
      'main-linked',
      'main2',
    ]);
    expect(resolveDeliveryRecipientAccountIds('medication', 'profile', familyAccounts, ['main2'])).toEqual([
      'main-linked',
    ]);
    expect(resolveDeliveryRecipientAccountIds('revisit', 'profile', [], [])).toEqual([]);
  });
  it('TC-476/477: phân biệt thiết bị mất, consent và người nhận hiện hành trước khi gửi', () => {
    expect(checkReminderDeliveryEligibility('revisit', input)).toBe('ok');
    expect(checkReminderDeliveryEligibility('medication', input)).toBe('revoked_recipient');
    expect(checkReminderDeliveryEligibility('revisit', { ...input, deviceAccountId: 'other' })).toBe(
      'revoked_recipient',
    );
    expect(checkReminderDeliveryEligibility('revisit', { ...input, consentConfirmed: false })).toBe(
      'revoked_consent',
    );
    expect(checkReminderDeliveryEligibility('revisit', { ...input, deviceAccountId: null })).toBe(
      'revoked_device',
    );
  });
});
