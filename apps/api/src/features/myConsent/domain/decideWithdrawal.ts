import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';

type WithdrawalDecision = 'withdraw' | 'ERR_NOT_FOUND' | 'ERR_CONSENT_NOT_CONFIRMED';

// SPEC-036: chỉ tài khoản liên kết hồ sơ mới rút được (main không rút thay), và chỉ khi đang đã đồng thuận.
// Hồ sơ không thấy (khác gia đình/RLS/đã xóa) đồng nhất với không liên kết để không lộ khác biệt.
export function decideWithdrawal(input: {
  linkedProfileId: string | null;
  profile: { id: string; consentStatus: ConsentStatus } | null;
}): WithdrawalDecision {
  const { linkedProfileId, profile } = input;
  if (!linkedProfileId || !profile || profile.id !== linkedProfileId) return 'ERR_NOT_FOUND';
  return profile.consentStatus === 'confirmed' ? 'withdraw' : 'ERR_CONSENT_NOT_CONFIRMED';
}
