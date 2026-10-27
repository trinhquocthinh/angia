import { describe, expect, it } from 'vitest';
import { familyId, policyInput, view } from '../test/scanQuotaFixtures';
import { toPolicyDraft } from './toPolicyDraft';
import { buildPolicyRequest } from './buildPolicyRequest';
import { createGrantDrafts } from './createGrantDrafts';
import { buildGrantRequest } from './buildGrantRequest';
describe('Bản sửa chính sách và cấp lượt', () => {
  it('TC-591: chưa cấu hình thì ba ô trống, không tự đặt ví dụ', () => {
    expect(toPolicyDraft(view)).toEqual({
      month: '2026-10',
      expectedVersion: 7,
      estimatedCostPerScanUsd: '',
      reservePercent: '',
      trialScans: '',
    });
    expect(buildPolicyRequest(toPolicyDraft(view)).request).toBeNull();
  });
  it('TC-591: số tiền giữ nguyên chuỗi, phần trăm đổi chính xác, dùng version bản sửa', () => {
    const draft = toPolicyDraft({ ...view, version: 2, policy: policyInput.policy });
    expect(draft.reservePercent).toBe('12.34');
    expect(buildPolicyRequest(draft).request).toEqual({ ...policyInput, expectedVersion: 2 });
  });
  it.each(['', '1.001', '1e1', '-1', '100.01', 'NaN'])(
    'TC-591: từ chối phần trăm không hợp lệ %s',
    (reservePercent) => {
      const result = buildPolicyRequest({
        ...toPolicyDraft({ ...view, policy: policyInput.policy }),
        reservePercent,
      });
      expect(result.request).toBeNull();
      expect(result.errors.reservePercent).toBeTruthy();
    },
  );
  it.each(['0', '-1', '1e-2', '0.0000000000001'])(
    'TC-591: từ chối ước tính ngoài hợp đồng %s',
    (estimatedCostPerScanUsd) => {
      expect(
        buildPolicyRequest({
          ...toPolicyDraft({ ...view, policy: policyInput.policy }),
          estimatedCostPerScanUsd,
        }).errors.estimatedCostPerScanUsd,
      ).toBeTruthy();
    },
  );
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
});
