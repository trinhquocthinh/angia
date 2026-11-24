import type pg from 'pg';
import { expect, it, vi } from 'vitest';
import { createDeletedUsernameCleanupRepository } from './createDeletedUsernameCleanupRepository.js';

it('TC-831: xoá tên hết hạn sau 90 ngày và trả số dòng, không đọc hash', async () => {
  const query = vi.fn(async () => ({ rowCount: 2 }));
  const repository = createDeletedUsernameCleanupRepository({ query } as unknown as pg.Pool);
  expect(await repository.removeExpired()).toBe(2);
  expect(query).toHaveBeenCalledWith(
    "DELETE FROM deleted_usernames WHERE deleted_at <= now() - interval '90 days'",
  );
});
it('TC-831: không có dòng hết hạn trả số không', async () => {
  const query = vi.fn(async () => ({ rowCount: null }));
  const repository = createDeletedUsernameCleanupRepository({ query } as unknown as pg.Pool);
  expect(await repository.removeExpired()).toBe(0);
});
