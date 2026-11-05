import {
  grantScanQuotasRequestSchema,
  type AdminScanQuotaView,
  type GrantScanQuotasRequest,
} from '@angia/contracts';
import { formatBillingUsd } from '@src/features/aiBilling/application/formatBillingUsd';
import type { GrantDrafts, GrantErrors } from './ports';
import { requiredCapIncreaseUsd } from './requiredCapIncreaseUsd';
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
  // CP5.5: kiểm sớm phần vượt dự toán để báo số USD cần nâng; máy chủ vẫn kiểm lại.
  const added = grants.reduce(
    (sum, grant) =>
      sum + grant.grantedScans - view.families.find((f) => f.familyId === grant.familyId)!.quota.grantedScans,
    0,
  );
  const shortfall = added - Number(view.availableAdditionalScans ?? Infinity);
  if (view.policy && shortfall > 0 && Object.keys(errors).length === 0)
    errors.selection = `Vượt dự toán ${shortfall} lượt; cần nâng chi phí cố định tháng thêm khoảng ${formatBillingUsd(
      requiredCapIncreaseUsd(view.policy, shortfall),
    )}.`;
  const parsed = grantScanQuotasRequestSchema.safeParse({
    month: view.month,
    expectedVersion: view.version,
    grants,
  });
  return { request: parsed.success && Object.keys(errors).length === 0 ? parsed.data : null, errors };
}
