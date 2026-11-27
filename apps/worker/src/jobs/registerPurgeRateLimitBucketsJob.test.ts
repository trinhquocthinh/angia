import type { PgBoss } from 'pg-boss';
import { expect, it, vi } from 'vitest';
import { registerPurgeRateLimitBucketsJob } from './registerPurgeRateLimitBucketsJob.js';

function fixture() {
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  const logger = { info: vi.fn(), error: vi.fn() };
  const deps = { repository: { removeExpired: vi.fn(async () => 2) } };
  return { boss, logger, deps };
}
it('TC-E31-S3-T1: đăng ký singleton hằng giờ và chỉ log số dòng đã xoá', async () => {
  const { boss, logger, deps } = fixture();
  await registerPurgeRateLimitBucketsJob(boss as unknown as PgBoss, deps, logger);
  expect(boss.createQueue).toHaveBeenCalledWith(
    'purge-rate-limit-buckets',
    expect.objectContaining({ policy: 'singleton' }),
  );
  expect(boss.schedule).toHaveBeenCalledWith('purge-rate-limit-buckets', '7 * * * *', null, {
    tz: 'Asia/Ho_Chi_Minh',
  });
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { id: string }[]) => Promise<void>;
  await handle([]);
  expect(logger.info).not.toHaveBeenCalled();
  await handle([{ id: 'secret-job' }]);
  expect(logger.info).toHaveBeenCalledWith({ removed: 2 }, expect.any(String));
  expect(JSON.stringify(logger.info.mock.calls)).not.toContain('secret-job');
});
it('TC-E31-S3-T1: lỗi job chỉ ghi thông báo cố định, không log dữ liệu lỗi', async () => {
  const { boss, logger, deps } = fixture();
  deps.repository.removeExpired.mockRejectedValueOnce(new Error('secret-hash'));
  await registerPurgeRateLimitBucketsJob(boss as unknown as PgBoss, deps, logger);
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { id: string }[]) => Promise<void>;
  await expect(handle([{ id: 'secret-job' }])).rejects.toThrow('purge_rate_limit_buckets_failed');
  expect(logger.error).toHaveBeenCalledWith({ failed: 1 }, expect.any(String));
  expect(JSON.stringify(logger.error.mock.calls)).not.toContain('secret-hash');
});
