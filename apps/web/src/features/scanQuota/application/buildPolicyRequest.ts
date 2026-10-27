import { updateScanQuotaPolicyRequestSchema, type UpdateScanQuotaPolicyRequest } from '@angia/contracts';
import type { PolicyDraft, PolicyErrors } from './ports';
export function buildPolicyRequest(draft: PolicyDraft): {
  request: UpdateScanQuotaPolicyRequest | null;
  errors: PolicyErrors;
} {
  const errors: PolicyErrors = {};
  const validPercent = /^(0|[1-9][0-9]{0,2})(\.[0-9]{1,2})?$/.test(draft.reservePercent);
  const [whole = '', fraction = ''] = draft.reservePercent.split('.');
  const points = validPercent ? Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))) : -1;
  if (!validPercent || points > 10000)
    errors.reservePercent = 'Nhập phần trăm từ 0 đến 100, tối đa 2 chữ số thập phân.';
  if (!/^(0|[1-9][0-9]*)$/.test(draft.trialScans)) errors.trialScans = 'Nhập số lượt nguyên không âm.';
  const parsed = updateScanQuotaPolicyRequestSchema.safeParse({
    month: draft.month,
    expectedVersion: draft.expectedVersion,
    policy: {
      estimatedCostPerScanUsd: draft.estimatedCostPerScanUsd,
      reserveBasisPoints: points,
      trialScans: Number(draft.trialScans),
    },
  });
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const field = issue.path[1];
      if (field === 'estimatedCostPerScanUsd')
        errors.estimatedCostPerScanUsd =
          'Nhập chi phí lớn hơn 0, tối đa 12 chữ số thập phân; không dùng số mũ.';
      if (field === 'trialScans') errors.trialScans = 'Nhập số lượt nguyên không âm trong giới hạn cho phép.';
    }
  return { request: parsed.success && Object.keys(errors).length === 0 ? parsed.data : null, errors };
}
