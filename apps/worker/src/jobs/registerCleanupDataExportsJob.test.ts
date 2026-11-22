import type { PgBoss } from 'pg-boss';
import { expect, it, vi } from 'vitest';
import type { CleanupDataExportsDependencies } from '@src/features/dataExportCleanup/application/ports.js';
import { registerCleanupDataExportsJob } from './registerCleanupDataExportsJob.js';

function fixture() {
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  const logger = { info: vi.fn(), error: vi.fn() };
  const deps: CleanupDataExportsDependencies = {
    repository: {
      async *expired() {
        /* Không có dòng hết hạn. */
      },
      removeExpired: vi.fn(),
      expireStale: async () => ({ pendingFailed: 0, failedRemoved: 0 }),
      isActive: vi.fn(),
    },
    storage: {
      async *list() {
        /* Bucket rỗng. */
      },
      delete: vi.fn(),
    },
  };
  return { boss, logger, deps };
}
it('TC-825: đăng ký singleton mỗi giờ và chỉ log số đếm', async () => {
  const { boss, logger, deps } = fixture();
  await registerCleanupDataExportsJob(boss as unknown as PgBoss, deps, logger);
  expect(boss.createQueue).toHaveBeenCalledWith(
    'cleanup-data-exports',
    expect.objectContaining({ policy: 'singleton' }),
  );
  expect(boss.schedule).toHaveBeenCalledWith('cleanup-data-exports', '0 * * * *', null, {
    tz: 'Asia/Ho_Chi_Minh',
  });
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { id: string }[]) => Promise<void>;
  await handle([]);
  expect(logger.info).not.toHaveBeenCalled();
  await handle([{ id: 'secret-id' }]);
  expect(logger.info).toHaveBeenCalledWith(
    { expiredRemoved: 0, pendingFailed: 0, failedRemoved: 0, orphanRemoved: 0, failed: 0 },
    expect.any(String),
  );
  expect(JSON.stringify(logger.info.mock.calls)).not.toContain('secret-id');
});
it('TC-825: lỗi hạ tầng chỉ lưu thông báo cố định để retry', async () => {
  const { boss, logger, deps } = fixture();
  deps.repository.expireStale = async () => {
    throw new Error('secret-id');
  };
  await registerCleanupDataExportsJob(boss as unknown as PgBoss, deps, logger);
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { id: string }[]) => Promise<void>;
  await expect(handle([{ id: 'secret-id' }])).rejects.toThrow('cleanup_data_exports_failed');
  expect(JSON.stringify(logger.error.mock.calls)).not.toContain('secret-id');
});
