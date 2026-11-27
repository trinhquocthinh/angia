import { expect, it, vi } from 'vitest';
import { purgeRateLimitBuckets } from './purgeRateLimitBuckets.js';

it('TC-E31-S3-T1: dọn bucket giới hạn tần suất đã hết hạn và chỉ trả số dòng', async () => {
  const repository = { removeExpired: vi.fn(async () => 3) };
  expect(await purgeRateLimitBuckets({ repository })).toEqual({ removed: 3 });
});
it('TC-E31-S3-T1: lỗi hạ tầng được truyền để job có thể thử lại', async () => {
  const repository = {
    removeExpired: async () => {
      throw new Error('database_unavailable');
    },
  };
  await expect(purgeRateLimitBuckets({ repository })).rejects.toThrow('database_unavailable');
});
