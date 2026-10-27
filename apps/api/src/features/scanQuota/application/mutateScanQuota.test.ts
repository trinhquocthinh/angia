import { describe, expect, it, vi } from 'vitest';
import { mutateScanQuota } from './mutateScanQuota.js';
import type { ScanQuotaDependencies } from './ports.js';
describe('Duyệt quota đúng tháng VN', () => {
  it('TC-581: từ chối yêu cầu tháng cũ trước khi ghi kho', async () => {
    const updatePolicy = vi.fn();
    const deps = {
      repository: { updatePolicy },
      now: () => new Date('2026-10-31T17:00:00Z'),
      defaultMonthlyCapUsd: 5,
    } as unknown as ScanQuotaDependencies;
    expect(
      await mutateScanQuota(
        deps,
        'policy',
        {
          month: '2026-10',
          expectedVersion: 0,
          policy: { estimatedCostPerScanUsd: '1', reserveBasisPoints: 0, trialScans: 0 },
        },
        'actor',
      ),
    ).toEqual({ ok: false, code: 'ERR_SCAN_QUOTA_CONFLICT' });
    expect(updatePolicy).not.toHaveBeenCalled();
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
    expect(await mutateScanQuota(deps, 'grant', request, 'actor')).toEqual(result);
    expect(grant).toHaveBeenCalledWith(request, 'actor', {
      now,
      recheckNow: deps.now,
      defaultMonthlyCapUsd: 5,
    });
  });
  it('TC-581: chính sách tháng hiện tại được chuyển vào giao dịch của kho', async () => {
    const result = { ok: false as const, code: 'ERR_SCAN_QUOTA_CONFLICT' as const };
    const updatePolicy = vi.fn().mockResolvedValue(result);
    const deps = {
      repository: { updatePolicy },
      now: () => new Date('2026-10-31T17:00:00Z'),
      defaultMonthlyCapUsd: 5,
    } as unknown as ScanQuotaDependencies;
    const request = {
      month: '2026-11',
      expectedVersion: 1,
      policy: { estimatedCostPerScanUsd: '1', reserveBasisPoints: 0, trialScans: 0 },
    };
    expect(await mutateScanQuota(deps, 'policy', request, 'actor')).toEqual(result);
    expect(updatePolicy).toHaveBeenCalledWith(
      request,
      'actor',
      expect.objectContaining({ defaultMonthlyCapUsd: 5 }),
    );
  });
});
