import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import type {
  DeliveryRepository,
  ReminderNotifier,
} from '@src/features/reminderDelivery/application/ports.js';
import { registerSendRemindersJob } from './registerSendRemindersJob.js';

const NOW = new Date('2026-10-23T01:00:00Z');
const FAMILY = '0199a000-0000-7000-8000-000000000001';

const ZERO = {
  fannedOut: 0,
  expiredBeforeFanout: 0,
  accepted: 0,
  retried: 0,
  failed: 0,
  gone: 0,
  expired: 0,
  revoked: 0,
};

// Repository giả: listFamilyIds quyết định kết quả của sendReminders thật.
function setup(families: string[] | Error = []) {
  const repository = {
    listFamilyIds: vi.fn(async () => {
      if (families instanceof Error) throw families;
      return families;
    }),
    withFanOut: vi.fn(async (_id: string, work: (s: unknown) => Promise<unknown>) =>
      work({
        listUnsentDue: async () => [],
        listFamilyAccounts: async () => [],
        listAssignments: async () => [],
        listDeviceIds: async () => [],
        markFannedOut: async () => undefined,
      }),
    ),
    processNextDelivery: vi.fn(async () => null),
  } as unknown as DeliveryRepository;
  const notifier = { send: vi.fn() } as unknown as ReminderNotifier;
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return { repository, notifier, boss, logger };
}

type Handler = (jobs: { id: string; data: unknown; signal: AbortSignal }[]) => Promise<unknown>;

async function register(deps: ReturnType<typeof setup>) {
  await registerSendRemindersJob(
    deps.boss as unknown as PgBoss,
    deps.repository,
    deps.notifier,
    { now: () => NOW },
    deps.logger as unknown as Logger,
  );
  const handler = deps.boss.work.mock.calls[0]?.[2] as Handler;
  return (signal = new AbortController().signal) => handler([{ id: 'j1', data: null, signal }]);
}

describe('Job send-reminders (SPEC-027)', () => {
  it('đăng ký hàng đợi singleton không retry, cron mỗi phút giờ Việt Nam, worker batchSize 1', async () => {
    const deps = setup();
    await register(deps);
    expect(deps.boss.createQueue).toHaveBeenCalledWith('send-reminders', {
      policy: 'singleton',
      retryLimit: 0,
      expireInSeconds: 300,
    });
    expect(deps.boss.schedule).toHaveBeenCalledWith('send-reminders', '* * * * *', null, {
      tz: 'Asia/Ho_Chi_Minh',
    });
    expect(deps.boss.work).toHaveBeenCalledWith('send-reminders', { batchSize: 1 }, expect.any(Function));
  });

  it('lượt không có việc ghi debug (tránh spam log mỗi phút), không info/warn/error', async () => {
    const deps = setup([FAMILY]);
    await (
      await register(deps)
    )();
    expect(deps.logger.debug).toHaveBeenCalledWith({ totals: ZERO, failedFamilies: 0 }, expect.any(String));
    expect(deps.logger.info).not.toHaveBeenCalled();
    expect(deps.logger.warn).not.toHaveBeenCalled();
    expect(deps.logger.error).not.toHaveBeenCalled();
  });

  it('lỗi liệt kê gia đình → aborted: log error, không ném lỗi', async () => {
    const deps = setup(new Error('boom Metformin'));
    await expect((await register(deps))()).resolves.not.toThrow();
    expect(deps.logger.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(deps.logger.error.mock.calls)).not.toContain('Metformin');
  });

  it('gia đình lỗi → info có failedFamilies và warn chỉ có familyId + mã lỗi', async () => {
    const deps = setup([FAMILY]);
    deps.repository.withFanOut = vi.fn(async () => {
      throw Object.assign(new Error('chi tiết Metformin'), { code: '42501' });
    }) as DeliveryRepository['withFanOut'];
    await (
      await register(deps)
    )();
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ failedFamilies: 1 }),
      expect.any(String),
    );
    expect(deps.logger.warn).toHaveBeenCalledWith(
      { failures: [{ familyId: FAMILY, code: '42501' }] },
      expect.any(String),
    );
    expect(JSON.stringify(deps.logger.warn.mock.calls)).not.toContain('Metformin');
  });

  it('job.signal đã hủy (job hết hạn) → không fan-out, không gửi; output là totals', async () => {
    const deps = setup([FAMILY]);
    const controller = new AbortController();
    controller.abort();
    const output = await (await register(deps))(controller.signal);
    expect(deps.repository.withFanOut).not.toHaveBeenCalled();
    expect(deps.repository.processNextDelivery).not.toHaveBeenCalled();
    expect(output).toEqual(ZERO);
  });
});
