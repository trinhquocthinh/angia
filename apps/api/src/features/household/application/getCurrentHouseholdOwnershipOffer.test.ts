import { expect, it } from 'vitest';
import { getCurrentHouseholdOwnershipOffer } from './getCurrentHouseholdOwnershipOffer.js';
const actor = { accountId: 'owner', familyId: 'family', role: 'main' as const };
it('TC-920: trả dữ liệu đang chờ với thời điểm ISO', async () => {
  const value = {
    id: 'offer',
    status: 'pending',
    createdAt: new Date(0),
    offeredBy: { accountId: 'owner', displayName: 'An' },
    target: { accountId: 'target', displayName: 'Bình' },
  } as const;
  const repository = { current: async () => ({ ok: true, offer: value }) as const };
  expect(await getCurrentHouseholdOwnershipOffer(repository, actor)).toEqual({
    ok: true,
    value: { ...value, createdAt: new Date(0).toISOString() },
  });
});
it('TC-921: chặn chưa có nhà và Thành viên trước khi đọc kho', async () => {
  const repository = {
    current: async () => {
      throw new Error('Không được đọc kho');
    },
  };
  for (const input of [
    { ...actor, familyId: null },
    { ...actor, role: 'member' as const },
  ])
    expect(await getCurrentHouseholdOwnershipOffer(repository, input)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
});
it('TC-922: giữ nguyên lỗi kiểm tra quyền và không tìm thấy từ kho', async () => {
  for (const code of ['ERR_NOT_FOUND', 'ERR_FORBIDDEN', 'ERR_UNAUTHENTICATED'] as const) {
    const repository = { current: async () => ({ ok: false, code }) as const };
    expect(await getCurrentHouseholdOwnershipOffer(repository, actor)).toEqual({ ok: false, code });
  }
});
