import { expect, it, vi } from 'vitest';
import { purgeDeletedUsernames } from './purgeDeletedUsernames.js';

it('TC-831: dọn tên đăng nhập đã hết thời gian giữ và chỉ trả số dòng', async () => {
  const repository = { removeExpired: vi.fn(async () => 3) };
  expect(await purgeDeletedUsernames({ repository })).toEqual({ removed: 3 });
});
it('TC-831: lỗi hạ tầng được truyền để job có thể thử lại', async () => {
  const repository = {
    removeExpired: async () => {
      throw new Error('database_unavailable');
    },
  };
  await expect(purgeDeletedUsernames({ repository })).rejects.toThrow('database_unavailable');
});
