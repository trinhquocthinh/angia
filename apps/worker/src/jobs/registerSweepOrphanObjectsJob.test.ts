import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import type { SweepDependencies, SweepPolicy } from '@src/features/orphanObjects/application/ports.js';
import { registerSweepOrphanObjectsJob } from './registerSweepOrphanObjectsJob.js';

const NOW = new Date('2026-10-20T20:00:00Z');
const OLD = new Date(NOW.getTime() - 25 * 3600_000);
const fam = (n: number) => `0199a000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const folder = (f: string) =>
  `families/${f}/profiles/0199b000-0000-7000-8000-000000000001/documents/0199b000-0000-7000-8000-000000000002`;

function setup(maxDeletes = 500) {
  const [empty, swept] = [fam(1), fam(2)];
  const objects: Record<string, string[]> = {
    [empty]: [`${folder(empty)}/original.jpg`],
    [swept]: [
      `${folder(swept)}/original.jpg`,
      `${folder(swept)}/previews/0199c000-0000-7000-8000-000000000001.webp`,
      `${folder(swept)}/previews/0199c000-0000-7000-8000-000000000002.webp`,
    ],
  };
  const deps: SweepDependencies = {
    repository: {
      listFamilyIds: async () => [empty, swept],
      referencedKeys: async (f) => new Set(f === swept ? [`${folder(swept)}/original.jpg`] : []),
    },
    storage: {
      async *list(prefix) {
        for (const key of objects[prefix.split('/')[1] ?? ''] ?? []) yield { key, lastModified: OLD };
      },
      delete: async () => undefined,
    },
  };
  const policy: SweepPolicy = { graceHours: 24, maxDeletes, dryRun: false, now: () => NOW };
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { deps, policy, boss, logger, empty, signal: new AbortController().signal };
}

async function runJob(maxDeletes?: number) {
  const ctx = setup(maxDeletes);
  await registerSweepOrphanObjectsJob(
    ctx.boss as unknown as PgBoss,
    ctx.deps,
    ctx.policy,
    ctx.logger as unknown as Logger,
  );
  const handler = ctx.boss.work.mock.calls[0]?.[2] as (
    jobs: { id: string; data: unknown; signal: AbortSignal }[],
  ) => Promise<void>;
  await handler([{ id: 'j1', data: null, signal: ctx.signal }]);
  return ctx;
}

describe('Job sweep-orphan-objects (SPEC-032)', () => {
  it('TC-322: đăng ký cron 03:00 giờ Việt Nam, queue singleton và ghi log không chứa khóa object', async () => {
    const { boss, logger, empty } = await runJob();
    expect(boss.createQueue).toHaveBeenCalledWith(
      'sweep-orphan-objects',
      expect.objectContaining({ policy: 'singleton', retryLimit: 0, expireInSeconds: 14_400 }),
    );
    expect(boss.schedule).toHaveBeenCalledWith('sweep-orphan-objects', '0 3 * * *', null, {
      tz: 'Asia/Ho_Chi_Minh',
    });
    expect(boss.work).toHaveBeenCalledWith('sweep-orphan-objects', { batchSize: 1 }, expect.any(Function));
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: empty, outcome: 'empty_references' }),
      expect.any(String),
    );
    expect(logger.info).toHaveBeenLastCalledWith(
      expect.objectContaining({ jobId: 'j1', removed: 2, capped: false }),
      expect.any(String),
    );
    expect(logger.error).not.toHaveBeenCalled();
    const logged = JSON.stringify([logger.info.mock.calls, logger.warn.mock.calls, logger.error.mock.calls]);
    expect(logged).not.toContain('families/');
  });

  it('TC-322: job bị hủy khi hết hạn thì log warn kèm aborted', async () => {
    const ctx = setup();
    const controller = new AbortController();
    controller.abort();
    await registerSweepOrphanObjectsJob(
      ctx.boss as unknown as PgBoss,
      ctx.deps,
      ctx.policy,
      ctx.logger as unknown as Logger,
    );
    const handler = ctx.boss.work.mock.calls[0]?.[2] as (
      jobs: { id: string; data: unknown; signal: AbortSignal }[],
    ) => Promise<void>;
    await handler([{ id: 'j2', data: null, signal: controller.signal }]);
    expect(ctx.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'j2', aborted: true, families: 0 }),
      expect.any(String),
    );
  });

  it('TC-322: chạm trần thì log error kèm capped', async () => {
    const { logger } = await runJob(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ capped: true, removed: 1 }),
      expect.any(String),
    );
  });
});
