import type { PgBoss } from 'pg-boss';
import { describe, expect, it, vi } from 'vitest';
import type { FamilyDeletionDependencies } from '@src/features/familyDeletion/application/ports.js';
import { registerExecuteFamilyDeletionJob } from './registerExecuteFamilyDeletionJob.js';

async function register(failed: boolean) {
  const deps: FamilyDeletionDependencies = {
    repository: {
      listDueFamilyIds: vi.fn(async () => ['fam']),
      withFamily: vi.fn(async () => {
        if (failed) throw new Error('DB lỗi giả lập');
        return 'none' as never;
      }),
    },
    storage: { list: async function* () {}, delete: vi.fn(async () => undefined) },
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  await registerExecuteFamilyDeletionJob(boss as unknown as PgBoss, deps);
  const handler = boss.work.mock.calls[0]?.[2] as (jobs: { id: string }[]) => Promise<void>;
  return { boss, deps, handler };
}

describe('Job execute-family-deletion (SPEC-069)', () => {
  it('TC-806: đăng ký queue singleton, lịch mỗi 5 phút và worker xử lý từng job', async () => {
    const { boss, handler, deps } = await register(false);
    expect(boss.createQueue).toHaveBeenCalledWith(
      'execute-family-deletion',
      expect.objectContaining({ policy: 'singleton', retryLimit: 0 }),
    );
    expect(boss.schedule).toHaveBeenCalledWith('execute-family-deletion', '*/5 * * * *', null, {
      tz: 'Asia/Ho_Chi_Minh',
    });
    expect(boss.work).toHaveBeenCalledWith('execute-family-deletion', { batchSize: 1 }, expect.any(Function));
    await handler([{ id: 'j1' }]);
    expect(deps.repository.listDueFamilyIds).toHaveBeenCalledTimes(1);
    expect(deps.logger.info).toHaveBeenCalledWith(
      { jobId: 'j1', executed: 0, cancelled: 0, failed: 0 },
      expect.any(String),
    );
  });
  it('TC-806: có nhà lỗi → job ném lỗi an toàn để pg-boss ghi nhận, không lộ thông điệp DB', async () => {
    const { handler } = await register(true);
    await expect(handler([{ id: 'j1' }])).rejects.toThrow('family_deletion_failed');
  });
});
