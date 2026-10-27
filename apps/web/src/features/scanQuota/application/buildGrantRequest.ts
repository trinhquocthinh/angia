import {
  grantScanQuotasRequestSchema,
  type AdminScanQuotaView,
  type GrantScanQuotasRequest,
} from '@angia/contracts';
import type { GrantDrafts, GrantErrors } from './ports';
export function buildGrantRequest(
  view: AdminScanQuotaView,
  drafts: GrantDrafts,
): { request: GrantScanQuotasRequest | null; errors: GrantErrors } {
  const errors: GrantErrors = {};
  const grants = view.families
    .filter((family) => drafts[family.familyId]?.selected)
    .map((family) => {
      const draft = drafts[family.familyId]!;
      const total = Number(draft.grantedScans);
      if (
        !/^(0|[1-9][0-9]*)$/.test(draft.grantedScans) ||
        !Number.isSafeInteger(total) ||
        total < family.quota.grantedScans
      )
        errors[family.familyId] = 'Tổng lượt phải là số nguyên không nhỏ hơn tổng đã cấp.';
      if (!draft.reason.trim() || draft.reason.trim().length > 500)
        errors[family.familyId] = 'Nhập lý do từ 1 đến 500 ký tự.';
      return {
        familyId: family.familyId,
        status: 'approved' as const,
        grantedScans: total,
        reason: draft.reason.trim(),
      };
    });
  if (grants.length === 0 || grants.length > 100)
    errors.selection = 'Chọn từ 1 đến 100 gia đình để duyệt cùng lúc.';
  const parsed = grantScanQuotasRequestSchema.safeParse({
    month: view.month,
    expectedVersion: view.version,
    grants,
  });
  return { request: parsed.success && Object.keys(errors).length === 0 ? parsed.data : null, errors };
}
