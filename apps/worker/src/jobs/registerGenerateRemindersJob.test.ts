import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import type {
  FamilyAccount,
  ProfileSnapshot,
} from '@src/features/reminderGeneration/domain/DailyReminder.js';
import { createMemoryReminderRepository } from '@src/shared/test/createMemoryReminderRepository.js';
import { registerGenerateRemindersJob } from './registerGenerateRemindersJob.js';

const FAMILY = '0199a000-0000-7000-8000-000000000001';
const BROKEN = '0199a000-0000-7000-8000-000000000002';
const PROFILE = '0199b000-0000-7000-8000-000000000001';
const MAIN: FamilyAccount = {
  id: '0199b000-0000-7000-8000-000000000100',
  role: 'main',
  healthProfileId: null,
};
// 2026-10-22T17:05Z = 00:05 ngày 23/10 giờ Việt Nam.
const NOW = new Date('2026-10-22T17:05:00Z');

const profile: ProfileSnapshot = {
  profileId: PROFILE,
  consentConfirmed: true,
  slotTimes: { morning: '07:00' },
  courses: [
    {
      id: '0199c000-0000-7000-8000-000000000001',
      name: 'Metformin',
      strength: '500mg',
      quantityPerDose: '1',
      doseUnit: 'viên',
      slots: ['morning', 'noon'],
      startDate: '2026-10-01',
      endDate: null,
    },
  ],
  assignedAccountIds: [MAIN.id],
};

type Handler = (jobs: { id: string; data: unknown; signal: AbortSignal }[]) => Promise<unknown>;

async function setup(failingFamilyId?: string) {
  const repository = createMemoryReminderRepository(
    { [FAMILY]: { accounts: [MAIN], profiles: [profile] }, [BROKEN]: { accounts: [], profiles: [] } },
    failingFamilyId ? { failingFamilyId } : {},
  );
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), send: vi.fn(), work: vi.fn() };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  await registerGenerateRemindersJob(
    boss as unknown as PgBoss,
    repository,
    { now: () => NOW },
    logger as unknown as Logger,
  );
  const handler = boss.work.mock.calls[0]?.[2] as Handler;
  const run = (data: unknown) => handler([{ id: 'j1', data, signal: new AbortController().signal }]);
  return { repository, boss, logger, run };
}

describe('Job generate-reminders (SPEC-027)', () => {
  it('đăng ký cron 00:05 giờ Việt Nam, retry khi lỗi và sinh bù ngày hôm nay lúc khởi động', async () => {
    const { boss } = await setup();
    expect(boss.createQueue).toHaveBeenCalledWith(
      'generate-reminders',
      expect.objectContaining({ policy: 'singleton', retryLimit: 3, retryBackoff: true }),
    );
    expect(boss.schedule).toHaveBeenCalledWith('generate-reminders', '5 0 * * *', null, {
      tz: 'Asia/Ho_Chi_Minh',
    });
    expect(boss.send).toHaveBeenCalledWith('generate-reminders', { date: '2026-10-23' });
    expect(boss.work).toHaveBeenCalledWith('generate-reminders', { batchSize: 1 }, expect.any(Function));
  });

  it('job từ cron (data null) sinh cho hôm nay theo giờ Việt Nam; job có date thì dùng date đó', async () => {
    const { repository, run } = await setup();
    await run(null);
    await run({ date: '2026-10-24' });
    expect(repository.stored().map((r) => r.date)).toEqual(['2026-10-23', '2026-10-24']);
  });

  it('log và kết quả job chỉ có id và số đếm, không có tên/liều thuốc; cảnh báo buổi thiếu khung giờ', async () => {
    const { logger, run } = await setup();
    const output = await run(null);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: FAMILY, unscheduledSlots: [{ profileId: PROFILE, slot: 'noon' }] }),
      expect.any(String),
    );
    expect(logger.info).toHaveBeenLastCalledWith(
      expect.objectContaining({ jobId: 'j1', date: '2026-10-23', created: 1 }),
      expect.any(String),
    );
    const logged = JSON.stringify([logger.info.mock.calls, logger.warn.mock.calls, output]);
    expect(logged).not.toContain('Metformin');
    expect(logged).not.toContain('500mg');
  });

  it('có gia đình lỗi thì ném lỗi để pg-boss chạy lại (idempotent), gia đình khác vẫn được sinh', async () => {
    const { repository, logger, run } = await setup(BROKEN);
    await expect(run(null)).rejects.toThrow();
    expect(repository.stored()).toHaveLength(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: BROKEN, reason: '42501' }),
      expect.any(String),
    );
  });

  it('từ chối payload date sai định dạng', async () => {
    const { run } = await setup();
    await expect(run({ date: '23/10/2026' })).rejects.toThrow();
  });
});
