import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import type {
  DeliveryRepository,
  ReminderNotifier,
  SendRemindersResult,
} from '@src/features/reminderDelivery/application/ports.js';

const sendRemindersMock = vi.hoisted(() => vi.fn());
vi.mock('@src/features/reminderDelivery/application/sendReminders.js', () => ({
  sendReminders: sendRemindersMock,
}));

import { handleSendRemindersJob } from './handleSendRemindersJob.js';

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

function run(result: SendRemindersResult) {
  sendRemindersMock.mockResolvedValue(result);
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  const handle = handleSendRemindersJob(
    {} as DeliveryRepository,
    {} as ReminderNotifier,
    { now: () => new Date('2026-10-23T01:00:00Z') },
    logger as unknown as Logger,
  );
  return { logger, done: handle({ id: 'j1', data: null }) };
}

const base: SendRemindersResult = {
  totals: ZERO,
  failures: [],
  expiredBeforeFanoutReminderIds: [],
  failedFamilies: 0,
  aborted: false,
};

describe('handleSendRemindersJob (SPEC-027)', () => {
  it('có việc → info { totals, failedFamilies }; cảnh báo đếm failed/expired và id lời nhắc quá hạn', async () => {
    const totals = { ...ZERO, accepted: 2, failed: 1, expired: 3 };
    const { logger, done } = run({
      ...base,
      totals,
      expiredBeforeFanoutReminderIds: ['r1'],
    });
    await done;
    expect(logger.info).toHaveBeenCalledWith({ totals, failedFamilies: 0 }, expect.any(String));
    expect(logger.warn).toHaveBeenCalledWith({ reminderIds: ['r1'] }, expect.any(String));
    expect(logger.warn).toHaveBeenCalledWith({ failed: 1, expired: 3 }, expect.any(String));
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it('log chỉ chứa khóa cho phép, không lọt tên thuốc hay endpoint', async () => {
    const { logger, done } = run({
      ...base,
      totals: { ...ZERO, failed: 1 },
      failures: [{ familyId: 'f1', code: '42501' }],
      failedFamilies: 1,
      aborted: true,
    });
    await expect(done).resolves.toBeUndefined();
    const allowed = new Set(['totals', 'failedFamilies', 'reminderIds', 'failures', 'failed', 'expired']);
    const calls = [logger.info, logger.warn, logger.error, logger.debug].flatMap((fn) => fn.mock.calls);
    for (const [payload] of calls)
      for (const key of Object.keys(payload as object)) expect(allowed.has(key)).toBe(true);
    expect(logger.error).toHaveBeenCalledTimes(1);
    const text = JSON.stringify(calls);
    expect(text).not.toContain('Metformin');
    expect(text).not.toContain('https://');
  });
});
