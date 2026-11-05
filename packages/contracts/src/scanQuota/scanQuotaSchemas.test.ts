import { describe, expect, it } from 'vitest';
import {
  scanQuotaPolicySchema,
  grantScanQuotasRequestSchema,
  familyScanQuotaSchema,
} from './scanQuotaSchemas.js';
const policy = { estimatedCostPerScanUsd: '0.000000000001', reserveBasisPoints: 10000, trialScans: 0 };
describe('Hợp đồng quota quét', () => {
  it('TC-578: chấp nhận số tiền thập phân chính xác và từ chối dạng mơ hồ', () => {
    expect(scanQuotaPolicySchema.safeParse(policy).success).toBe(true);
    for (const value of [
      '0',
      '-1',
      '+1',
      '1e-12',
      '0.0000000000001',
      '01',
      'NaN',
      '0x01',
      '10000000000000000000000000000',
    ])
      expect(scanQuotaPolicySchema.safeParse({ ...policy, estimatedCostPerScanUsd: value }).success).toBe(
        false,
      );
    expect(scanQuotaPolicySchema.safeParse({ ...policy, capUsd: '5' }).success).toBe(false);
  });
  it('TC-578: lô duyệt chỉ nhận approved, không lặp nhóm và phải có lý do', () => {
    const grant = {
      familyId: 'b3e8c5ce-46fb-40e0-8f2a-54e2ae38c195',
      status: 'approved',
      grantedScans: 1,
      reason: ' Duyệt tháng ',
    };
    const request = { month: '2026-10', expectedVersion: 0, grants: [grant] };
    expect(grantScanQuotasRequestSchema.parse(request).grants[0]?.reason).toBe('Duyệt tháng');
    for (const grants of [
      [],
      [grant, grant],
      [{ ...grant, status: 'trial' }],
      [{ ...grant, reason: ' ' }],
      Array.from({ length: 101 }, () => grant),
    ])
      expect(grantScanQuotasRequestSchema.safeParse({ ...request, grants }).success).toBe(false);
  });
  it('TC-578: cùng UUID viết hoa và viết thường vẫn là nhóm trùng trong lô duyệt', () => {
    const familyId = 'b3e8c5ce-46fb-40e0-8f2a-54e2ae38c195';
    const grant = { familyId, status: 'approved', grantedScans: 2, reason: 'Duyệt tháng' };
    const request = {
      month: '2026-10',
      expectedVersion: 1,
      grants: [grant, { ...grant, familyId: familyId.toUpperCase() }],
    };
    expect(grantScanQuotasRequestSchema.safeParse(request).success).toBe(false);
  });
  it('TC-578: DTO gia đình không chấp nhận USD, actor hoặc danh tính nhóm', () => {
    const quota = {
      month: '2026-10',
      status: 'unconfigured',
      grantedScans: 0,
      usedScans: 0,
      heldScans: 0,
      remainingScans: 0,
      runtimeActive: true,
    };
    expect(familyScanQuotaSchema.safeParse(quota).success).toBe(true);
    for (const extra of [{ familyId: 'x' }, { actualSpendUsd: '1' }, { actor: 'x' }])
      expect(familyScanQuotaSchema.safeParse({ ...quota, ...extra }).success).toBe(false);
  });
});
