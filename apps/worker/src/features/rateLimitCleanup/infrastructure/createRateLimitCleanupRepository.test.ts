import type pg from 'pg';
import { expect, it, vi } from 'vitest';
import { createRateLimitCleanupRepository } from './createRateLimitCleanupRepository.js';

it('TC-E31-S3-T1: xoá bucket cũ hơn một ngày và trả số dòng, không đọc hash', async () => {
  const query = vi.fn(async () => ({ rowCount: 2 }));
  const repository = createRateLimitCleanupRepository({ query } as unknown as pg.Pool);
  expect(await repository.removeExpired()).toBe(2);
  expect(query).toHaveBeenCalledWith(
    "DELETE FROM rate_limit_buckets WHERE window_start < now() - interval '1 day'",
  );
});
it('TC-E31-S3-T1: không có dòng hết hạn trả số không', async () => {
  const query = vi.fn(async () => ({ rowCount: null }));
  const repository = createRateLimitCleanupRepository({ query } as unknown as pg.Pool);
  expect(await repository.removeExpired()).toBe(0);
});
