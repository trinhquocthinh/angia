import { describe, expect, it, vi } from 'vitest';
import { mutateScanQuota } from './mutateScanQuota.js';
import type { ScanQuotaDependencies } from './ports.js';
describe('Duyệt quota đúng tháng VN', () => {
  it('TC-581: từ chối yêu cầu tháng cũ trước khi ghi kho', async () => {
    const grant = vi.fn();
    const deps = {
      repository: { grant },
      now: () => new Date('2026-10-31T17:00:00Z'),
      defaultMonthlyCapUsd: 5,
    } as unknown as ScanQuotaDependencies;
    expect(
      await mutateScanQuota(deps, { month: '2026-10', expectedVersion: 0, grants: [] }, 'actor'),
    ).toEqual({ ok: false, code: 'ERR_SCAN_QUOTA_CONFLICT' });
    expect(grant).not.toHaveBeenCalled();
  });
  it('TC-581: truyền một mốc thời gian và danh tính Admin vào giao dịch', async () => {
    const now = new Date('2026-10-31T17:00:00Z');
    const result = { ok: false as const, code: 'ERR_SCAN_QUOTA_UNAVAILABLE' as const };
    const grant = vi.fn().mockResolvedValue(result);
    const deps = {
      repository: { grant },
      now: () => now,
      defaultMonthlyCapUsd: 5,
    } as unknown as ScanQuotaDependencies;
    const request = { month: '2026-11', expectedVersion: 0, grants: [] };
    expect(await mutateScanQuota(deps, request, 'actor')).toEqual(result);
    expect(grant).toHaveBeenCalledWith(request, 'actor', {
      now,
      recheckNow: deps.now,
      defaultMonthlyCapUsd: 5,
    });
  });
});
