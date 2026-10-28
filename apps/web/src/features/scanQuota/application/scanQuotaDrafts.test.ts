import { describe, expect, it } from 'vitest';
import { familyId, view } from '../test/scanQuotaFixtures';
import { createGrantDrafts } from './createGrantDrafts';
import { buildGrantRequest } from './buildGrantRequest';
describe('Bản sửa cấp lượt', () => {
  it('TC-592: tải danh sách không chọn ai, gợi ý không đè tổng hiện tại cao hơn', () => {
    const drafts = createGrantDrafts(view);
    expect(drafts[familyId]).toEqual({ selected: false, grantedScans: '12', reason: '' });
    expect(buildGrantRequest(view, drafts).request).toBeNull();
  });
  it('TC-592: chỉ gửi dòng được chọn với tổng đã sửa và lý do, không gửi tăng thêm', () => {
    const drafts = createGrantDrafts(view);
    drafts[familyId] = { selected: true, grantedScans: '15', reason: '  Duyệt tháng  ' };
    expect(buildGrantRequest(view, drafts).request).toEqual({
      month: '2026-10',
      expectedVersion: 7,
      grants: [{ familyId, status: 'approved', grantedScans: 15, reason: 'Duyệt tháng' }],
    });
  });
  it('TC-592: không giảm tổng, bắt buộc lý do; mọi dòng đều hợp lệ mới gửi', () => {
    for (const [grantedScans, reason] of [
      ['11', 'Duyệt'],
      ['12', ''],
      ['9007199254740992', 'Duyệt'],
    ]) {
      expect(
        buildGrantRequest(view, {
          [familyId]: { selected: true, grantedScans: grantedScans!, reason: reason! },
        }).request,
      ).toBeNull();
    }
  });
  it('TC-592: duyệt bằng tổng hiện tại khi thêm được 0 vẫn hợp lệ', () => {
    const current = { ...view, availableAdditionalScans: '0' };
    expect(
      buildGrantRequest(current, { [familyId]: { selected: true, grantedScans: '12', reason: 'Xác nhận' } })
        .request,
    ).not.toBeNull();
  });
  it('TC-643: vượt lượt có thể cấp thêm thì không gửi, báo số USD cần nâng trần', () => {
    const current = {
      ...view,
      policy: { estimatedCostPerScanUsd: '0.001594000000', reserveBasisPoints: 1500, trialScans: 10 },
      availableAdditionalScans: '3',
    };
    const result = buildGrantRequest(current, {
      [familyId]: { selected: true, grantedScans: '20', reason: 'Nâng hạng' },
    });
    expect(result.request).toBeNull();
    expect(result.errors.selection).toBe(
      'Vượt dự toán 5 lượt; cần nâng chi phí cố định tháng thêm khoảng 0,01 USD.',
    );
  });
});
