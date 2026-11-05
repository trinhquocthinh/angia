import { describe, expect, it } from 'vitest';
import { getMyRevisitReminder } from './getMyRevisitReminder.js';
import type { MyRevisitReminderRepository } from './ports.js';

const id = '0199a000-0000-7000-8000-000000000001';
const value = {
  id,
  revisitDate: '2026-11-20',
  offset: 'same_day' as const,
  profileId: 'profile',
  profileName: 'Mẹ',
  prescriptions: [],
};
const load = (
  confirmed = true,
  accounts = [
    { id: 'main', displayName: 'Main', role: 'main' as const, healthProfileId: null },
    { id: 'linked', displayName: 'Mẹ', role: 'member' as const, healthProfileId: 'profile' },
  ],
): MyRevisitReminderRepository => ({
  load: async () => ({ reminder: value, consentConfirmed: confirmed, familyAccounts: accounts }),
});
const read = (accountId: string, repository = load(), reminderId = id) =>
  getMyRevisitReminder(repository, { familyId: 'family', accountId }, reminderId);

describe('getMyRevisitReminder', () => {
  it('TC-479: main và tài khoản liên kết có quyền, chỉ main mở tóm tắt', async () => {
    expect(await read('main')).toEqual({ ok: true, value: { ...value, canOpenSummary: true } });
    expect(await read('linked')).toEqual({ ok: true, value: { ...value, canOpenSummary: false } });
  });
  it('TC-479: ngoài người nhận, thiếu dữ liệu và consent chưa xác nhận đều cùng ERR_NOT_FOUND', async () => {
    for (const result of [
      await read('other'),
      await read('main', load(false)),
      await read('main', { load: async () => null }),
      await read('main', load(true, [])),
    ]) {
      expect(result).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    }
  });
  it('TC-479: ID sai không chạm kho dữ liệu', async () => {
    const repository: MyRevisitReminderRepository = {
      load: async () => {
        throw new Error('Không được truy vấn');
      },
    };
    expect(await read('main', repository, 'invalid')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
});
