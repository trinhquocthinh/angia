import { expect, it } from 'vitest';
import { getCurrentHouseholdDeletionRequest } from './getCurrentHouseholdDeletionRequest.js';
const actor = { accountId: 'owner', familyId: 'family', role: 'main' as const };
it('TC-923: trả dữ liệu đang chờ với thời điểm ISO', async () => {
  const value = { id: 'request', status: 'pending', executeAt: new Date(0) } as const;
  const repository = { current: async () => ({ ok: true, request: value }) as const };
  expect(await getCurrentHouseholdDeletionRequest(repository, actor)).toEqual({
    ok: true,
    value: { ...value, executeAt: new Date(0).toISOString() },
  });
});
it('TC-924: chặn chưa có nhà và Thành viên trước khi đọc kho', async () => {
  const repository = {
    current: async () => {
      throw new Error('Không được đọc kho');
    },
  };
  for (const input of [
    { ...actor, familyId: null },
    { ...actor, role: 'member' as const },
  ])
    expect(await getCurrentHouseholdDeletionRequest(repository, input)).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
});
it('TC-925: giữ nguyên lỗi kiểm tra quyền và không tìm thấy từ kho', async () => {
  for (const code of ['ERR_NOT_FOUND', 'ERR_FORBIDDEN', 'ERR_UNAUTHENTICATED'] as const) {
    const repository = { current: async () => ({ ok: false, code }) as const };
    expect(await getCurrentHouseholdDeletionRequest(repository, actor)).toEqual({ ok: false, code });
  }
});
