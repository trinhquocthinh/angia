import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import type { PurgeDependencies } from '@src/features/purgeProfileObjects/application/ports.js';
import { registerPurgeProfileObjectsJob } from './registerPurgeProfileObjectsJob.js';

const familyId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5c';
const profileId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5d';

async function register(exists = false) {
  const deps: PurgeDependencies = {
    repository: { profileExists: vi.fn(async () => exists) },
    storage: {
      async *list(prefix) {
        yield { key: `${prefix}documents/a/original.jpg` };
      },
      delete: vi.fn(async () => undefined),
    },
  };
  const boss = { createQueue: vi.fn(), work: vi.fn() };
  const logger = { info: vi.fn(), error: vi.fn() };
  await registerPurgeProfileObjectsJob(boss as unknown as PgBoss, deps, logger as unknown as Logger);
  const handler = boss.work.mock.calls[0]?.[2] as (jobs: { id: string; data: unknown }[]) => Promise<void>;
  return { deps, boss, logger, handler };
}

describe('Job purge-profile-objects (BR-010, SPEC-007)', () => {
  it('TC-368: tạo queue với retry đã chốt, xử lý từng job và log không chứa khóa object', async () => {
    const { boss, logger, handler } = await register();
    expect(boss.createQueue).toHaveBeenCalledWith('purge-profile-objects', {
      retryLimit: 5,
      retryDelay: 60,
      retryBackoff: true,
    });
    expect(boss.work).toHaveBeenCalledWith('purge-profile-objects', { batchSize: 1 }, expect.any(Function));
    await handler([{ id: 'j1', data: { familyId, profileId } }]);
    expect(logger.info).toHaveBeenCalledWith(
      { jobId: 'j1', familyId, profileId, outcome: 'purged', removed: 1 },
      expect.any(String),
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('families/');
  });
  it('TC-368: payload sai → log error, không ném, không xóa', async () => {
    const { deps, logger, handler } = await register();
    await expect(handler([{ id: 'j2', data: { familyId } }])).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith({ jobId: 'j2' }, expect.any(String));
    expect(deps.repository.profileExists).not.toHaveBeenCalled();
  });
});
