import { describe, expect, it } from 'vitest';
import { PREFLIGHT_REQUEST, type UsageCounts } from '../domain/FamilyQuota.js';
import { checkFamilyQuota } from './checkFamilyQuota.js';

const limits = { storageBytes: 100, dailyUploads: 10, pendingJobs: 3 };

function reader(usage: UsageCounts) {
  const calls: Array<{ dayStart: string; lock: boolean }> = [];
  const read = (dayStart: Date, lock: boolean) => {
    calls.push({ dayStart: dayStart.toISOString(), lock });
    return Promise.resolve(usage);
  };
  return { calls, read };
}

describe('checkFamilyQuota — đọc mức dùng theo ngày giờ Việt Nam rồi so ngưỡng (SPEC-030)', () => {
  const policy = { limits, now: () => new Date('2026-10-20T20:00:00Z') };

  it('đọc từ 00:00 giờ VN của hôm nay và truyền nguyên cờ khóa', async () => {
    const { calls, read } = reader({ storageBytes: 0, uploadsToday: 0, pendingJobs: 0 });
    expect(await checkFamilyQuota(read, policy, PREFLIGHT_REQUEST, true)).toEqual({ ok: true });
    expect(calls).toEqual([{ dayStart: '2026-10-20T17:00:00.000Z', lock: true }]);
  });

  it('hết lượt ảnh trong ngày → mốc reset là 0 giờ ngày kế tiếp giờ VN', async () => {
    const { read } = reader({ storageBytes: 0, uploadsToday: 10, pendingJobs: 0 });
    const result = await checkFamilyQuota(read, policy, PREFLIGHT_REQUEST, false);
    expect(result).toMatchObject({
      ok: false,
      code: 'ERR_DAILY_UPLOAD_QUOTA',
      details: { resetsAt: '2026-10-22T00:00:00+07:00' },
    });
  });
});
