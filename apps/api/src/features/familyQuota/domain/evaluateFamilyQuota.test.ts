import { describe, expect, it } from 'vitest';
import { evaluateFamilyQuota } from './evaluateFamilyQuota.js';
import { PREFLIGHT_REQUEST, type QuotaLimits } from './FamilyQuota.js';

const limits: QuotaLimits = { storageBytes: 100, dailyUploads: 10, pendingJobs: 3 };
const usage = { storageBytes: 90, uploadsToday: 5, pendingJobs: 1 };
const resetsAt = new Date('2026-10-19T17:00:00Z');

describe('TC-292 — so ngưỡng quota tài nguyên gia đình (SPEC-030, BR-043)', () => {
  it('đúng bằng trần ở cả ba chiều thì vẫn đạt', () => {
    expect(evaluateFamilyQuota(usage, { files: 2, bytes: 10, jobs: 2 }, limits, resetsAt)).toEqual({
      ok: true,
    });
  });

  it('vượt dung lượng 1 byte → ERR_STORAGE_QUOTA kèm số đã dùng/trần/phần xin thêm', () => {
    expect(evaluateFamilyQuota(usage, { files: 1, bytes: 11, jobs: 1 }, limits, resetsAt)).toEqual({
      ok: false,
      code: 'ERR_STORAGE_QUOTA',
      details: { usedBytes: 90, limitBytes: 100, requestedBytes: 11 },
    });
  });

  it('vượt số ảnh trong ngày → ERR_DAILY_UPLOAD_QUOTA kèm mốc 0 giờ giờ Việt Nam', () => {
    expect(evaluateFamilyQuota(usage, { files: 6, bytes: 1, jobs: 0 }, limits, resetsAt)).toEqual({
      ok: false,
      code: 'ERR_DAILY_UPLOAD_QUOTA',
      details: { used: 5, limit: 10, requested: 6, resetsAt: '2026-10-20T00:00:00+07:00' },
    });
  });

  it('vượt số chứng từ chờ worker → ERR_QUEUE_QUOTA', () => {
    expect(evaluateFamilyQuota(usage, { files: 0, bytes: 0, jobs: 3 }, limits, resetsAt)).toEqual({
      ok: false,
      code: 'ERR_QUEUE_QUOTA',
      details: { used: 1, limit: 3, requested: 3 },
    });
  });

  it('nhiều trần cùng vượt thì trả theo thứ tự dung lượng → ảnh/ngày → chờ worker', () => {
    const all = evaluateFamilyQuota(usage, { files: 6, bytes: 11, jobs: 3 }, limits, resetsAt);
    expect(all.ok ? null : all.code).toBe('ERR_STORAGE_QUOTA');
    const dailyAndQueue = evaluateFamilyQuota(usage, { files: 6, bytes: 1, jobs: 3 }, limits, resetsAt);
    expect(dailyAndQueue.ok ? null : dailyAndQueue.code).toBe('ERR_DAILY_UPLOAD_QUOTA');
  });

  it('phần xin thêm bằng 0 không bị tính vượt dù mức đã dùng cao hơn trần (hạ ngưỡng env)', () => {
    const over = { storageBytes: 150, uploadsToday: 12, pendingJobs: 1 };
    expect(evaluateFamilyQuota(over, { files: 0, bytes: 0, jobs: 1 }, limits, resetsAt)).toEqual({
      ok: true,
    });
  });

  it('kiểm sơ bộ (1 tệp, 1 byte, 1 job) chặn khi một trần đã chạm', () => {
    const code = (counts: typeof usage) => {
      const result = evaluateFamilyQuota(counts, PREFLIGHT_REQUEST, limits, resetsAt);
      return result.ok ? null : result.code;
    };
    expect(code({ storageBytes: 100, uploadsToday: 9, pendingJobs: 2 })).toBe('ERR_STORAGE_QUOTA');
    expect(code({ storageBytes: 99, uploadsToday: 10, pendingJobs: 2 })).toBe('ERR_DAILY_UPLOAD_QUOTA');
    expect(code({ storageBytes: 99, uploadsToday: 9, pendingJobs: 3 })).toBe('ERR_QUEUE_QUOTA');
    expect(code({ storageBytes: 99, uploadsToday: 9, pendingJobs: 2 })).toBeNull();
  });
});
