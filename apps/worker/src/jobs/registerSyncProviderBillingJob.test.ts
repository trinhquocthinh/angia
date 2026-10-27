import { expect, it, vi } from 'vitest';
import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { registerSyncProviderBillingJob } from './registerSyncProviderBillingJob.js';
it('TC-546: đăng ký đồng bộ mỗi phút với retry tắt, payload không chứa key', async () => {
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  await registerSyncProviderBillingJob(
    boss as unknown as PgBoss,
    [],
    { register: vi.fn(), claim: vi.fn(), finish: vi.fn(), fail: vi.fn(), observe: vi.fn() },
    { read: vi.fn() },
    { warn: vi.fn() } as unknown as Logger,
  );
  expect(boss.schedule).toHaveBeenCalledWith('sync-provider-billing', '* * * * *', null, {
    tz: 'Asia/Ho_Chi_Minh',
  });
  expect(boss.createQueue).toHaveBeenCalledWith('sync-provider-billing', {
    policy: 'singleton',
    retryLimit: 0,
    expireInSeconds: 120,
  });
});

it('TC-546: job đăng ký lỗi chỉ ghi mã cố định và không ghi lỗi chứa credential', async () => {
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  const warn = vi.fn();
  const repo = {
    register: async () => {
      throw new Error('synthetic-sensitive-value');
    },
    claim: vi.fn(),
    finish: vi.fn(),
    fail: vi.fn(),
    observe: vi.fn(),
  };
  await registerSyncProviderBillingJob(boss as unknown as PgBoss, [], repo, { read: vi.fn() }, {
    warn,
  } as unknown as Logger);
  const callback = boss.work.mock.calls[0]![2] as (jobs: unknown[]) => Promise<void>;
  await callback([{ id: 'job' }]);
  expect(warn).toHaveBeenCalledWith({ code: 'billing_sync_failed' }, 'Không thể đồng bộ phí nhà cung cấp');
  expect(JSON.stringify(warn.mock.calls)).not.toContain('synthetic-sensitive-value');
});
