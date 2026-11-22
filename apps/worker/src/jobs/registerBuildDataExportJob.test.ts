import type { PgBoss } from 'pg-boss';
import { expect, it, vi } from 'vitest';
import type { DataExportDependencies } from '@src/features/dataExport/application/ports.js';
import { registerBuildDataExportJob } from './registerBuildDataExportJob.js';

it('TC-819: đăng ký queue, xác thực UUID và không log payload nhạy cảm', async () => {
  const boss = { createQueue: vi.fn(), work: vi.fn() };
  const deps = {
    repository: { withPending: vi.fn(async () => 'skipped') },
  } as unknown as DataExportDependencies;
  const logger = { info: vi.fn(), error: vi.fn() };
  await registerBuildDataExportJob(boss as unknown as PgBoss, deps, logger);
  expect(boss.createQueue).toHaveBeenCalledWith('build-data-export', {
    retryLimit: 5,
    retryDelay: 60,
    retryBackoff: true,
  });
  expect(boss.work).toHaveBeenCalledWith('build-data-export', { batchSize: 1 }, expect.any(Function));
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { data: unknown }[]) => Promise<void>;
  await handle([]);
  await handle([{ data: { exportId: 'invalid', email: 'secret@example.test' } }]);
  expect(deps.repository.withPending).not.toHaveBeenCalled();
  const exportId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  await handle([{ data: { exportId } }]);
  expect(deps.repository.withPending).toHaveBeenCalledWith(exportId, expect.any(Function));
  expect(logger.info).toHaveBeenCalledWith({ exportId, outcome: 'skipped' }, expect.any(String));
  expect(JSON.stringify(logger.error.mock.calls)).not.toContain('secret');
});
it('TC-819: lỗi nội bộ được retry bằng thông báo cố định không lộ dữ liệu', async () => {
  const boss = { createQueue: vi.fn(), work: vi.fn() };
  const deps = {
    repository: {
      withPending: async () => {
        throw new Error('secret@example.test');
      },
    },
  } as unknown as DataExportDependencies;
  const logger = { info: vi.fn(), error: vi.fn() };
  await registerBuildDataExportJob(boss as unknown as PgBoss, deps, logger);
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { data: unknown }[]) => Promise<void>;
  await expect(handle([{ data: { exportId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } }])).rejects.toThrow(
    'build_data_export_failed',
  );
  expect(JSON.stringify(logger.error.mock.calls)).not.toContain('secret');
});
