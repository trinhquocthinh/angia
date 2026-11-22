import type { PgBoss } from 'pg-boss';
import { expect, it, vi } from 'vitest';
import { registerPurgeDeletedUsernamesJob } from './registerPurgeDeletedUsernamesJob.js';

function fixture() {
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  const logger = { info: vi.fn(), error: vi.fn() };
  const deps = { repository: { removeExpired: vi.fn(async () => 2) } };
  return { boss, logger, deps };
}
it('TC-831: đăng ký singleton hằng ngày và chỉ log số dòng đã xoá', async () => {
  const { boss, logger, deps } = fixture();
  await registerPurgeDeletedUsernamesJob(boss as unknown as PgBoss, deps, logger);
  expect(boss.createQueue).toHaveBeenCalledWith(
    'purge-deleted-usernames',
    expect.objectContaining({ policy: 'singleton' }),
  );
  expect(boss.schedule).toHaveBeenCalledWith('purge-deleted-usernames', '0 4 * * *', null, {
    tz: 'Asia/Ho_Chi_Minh',
  });
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { id: string }[]) => Promise<void>;
  await handle([]);
  expect(logger.info).not.toHaveBeenCalled();
  await handle([{ id: 'secret-job' }]);
  expect(logger.info).toHaveBeenCalledWith({ removed: 2 }, expect.any(String));
  expect(JSON.stringify(logger.info.mock.calls)).not.toContain('secret-job');
});
it('TC-831: lỗi job chỉ ghi thông báo cố định, không log dữ liệu lỗi', async () => {
  const { boss, logger, deps } = fixture();
  deps.repository.removeExpired.mockRejectedValueOnce(new Error('secret-hash'));
  await registerPurgeDeletedUsernamesJob(boss as unknown as PgBoss, deps, logger);
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { id: string }[]) => Promise<void>;
  await expect(handle([{ id: 'secret-job' }])).rejects.toThrow('purge_deleted_usernames_failed');
  expect(logger.error).toHaveBeenCalledWith({ failed: 1 }, expect.any(String));
  expect(JSON.stringify(logger.error.mock.calls)).not.toContain('secret-hash');
});
