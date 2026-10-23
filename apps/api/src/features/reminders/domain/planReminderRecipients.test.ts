import { describe, expect, it } from 'vitest';
import type { FamilyAccount } from './ReminderRecipient.js';
import { planReminderRecipients } from './planReminderRecipients.js';

const family: FamilyAccount[] = [
  { id: 'dad', displayName: 'Bố', role: 'main', healthProfileId: null },
  { id: 'mom', displayName: 'Mẹ', role: 'main', healthProfileId: 'mom-profile' },
  { id: 'grandma', displayName: 'Bà', role: 'member', healthProfileId: 'grandma-profile' },
];

describe('Chỉ định người nhận nhắc cho hồ sơ không liên kết (SPEC-026, BR-039)', () => {
  it('TC-069: cha và mẹ đều là main → 02 người nhận', () => {
    expect(planReminderRecipients('child', family, ['dad', 'mom'])).toEqual({
      ok: true,
      value: ['dad', 'mom'],
    });
  });
  it('TC-069: ID trùng lặp chỉ tính một lần', () => {
    expect(planReminderRecipients('child', family, ['mom', 'mom'])).toEqual({ ok: true, value: ['mom'] });
  });
  it('TC-070: chỉ định tài khoản member bị từ chối', () => {
    expect(planReminderRecipients('child', family, ['dad', 'grandma'])).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });
  it('TC-070: danh sách rỗng hoặc tài khoản ngoài gia đình bị từ chối', () => {
    expect(planReminderRecipients('child', family, [])).toMatchObject({ ok: false });
    expect(planReminderRecipients('child', family, ['stranger'])).toMatchObject({ ok: false });
  });
  it('hồ sơ đã liên kết tài khoản không cho đổi người nhận', () => {
    expect(planReminderRecipients('grandma-profile', family, ['dad'])).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });
});
