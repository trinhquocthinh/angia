import { describe, expect, it } from 'vitest';
import type { FamilyAccount } from './ReminderRecipient.js';
import { resolveReminderRecipients } from './resolveReminderRecipients.js';

const family: FamilyAccount[] = [
  { id: 'dad', displayName: 'Bố', role: 'main', healthProfileId: null },
  { id: 'mom', displayName: 'Mẹ', role: 'main', healthProfileId: null },
  { id: 'grandma', displayName: 'Bà', role: 'member', healthProfileId: 'grandma-profile' },
];
const mains = [
  { accountId: 'dad', displayName: 'Bố' },
  { accountId: 'mom', displayName: 'Mẹ' },
];

describe('Xác định người nhận nhắc hiện hành (SPEC-026, BR-039)', () => {
  it('hồ sơ liên kết: người nhận cố định là tài khoản liên kết, bỏ qua danh sách đã lưu', () => {
    expect(resolveReminderRecipients('grandma-profile', family, ['dad'])).toEqual({
      mode: 'linked',
      recipients: [{ accountId: 'grandma', displayName: 'Bà' }],
      candidates: mains,
    });
  });
  it('hồ sơ không liên kết: trả người nhận đã chỉ định theo thứ tự tài khoản gia đình', () => {
    expect(resolveReminderRecipients('child', family, ['mom', 'dad'])).toEqual({
      mode: 'assigned',
      recipients: mains,
      candidates: mains,
    });
  });
  it('người nhận đã bị hạ xuống member hoặc rời gia đình bị lọc khỏi danh sách', () => {
    expect(resolveReminderRecipients('child', family, ['grandma', 'gone', 'mom']).recipients).toEqual([
      { accountId: 'mom', displayName: 'Mẹ' },
    ]);
  });
  it('chưa chỉ định thì không có người nhận mặc định', () => {
    expect(resolveReminderRecipients('child', family, []).recipients).toEqual([]);
  });
});
