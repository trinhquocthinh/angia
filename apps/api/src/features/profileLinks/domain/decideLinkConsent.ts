import type { ConsentPatch, LinkAccount, LinkDecision, LinkProfile } from './ProfileLink.js';

// BR-047, LG-02: người được liên kết là chủ thể dữ liệu nên quyết định của họ thắng mọi cam kết của main.
// null = không đổi trạng thái đồng thuận (hồ sơ đã rút thì từ chối không làm gì thêm).
export function decideLinkConsent(
  profile: LinkProfile,
  decision: LinkDecision,
  account: LinkAccount,
  at: Date,
): ConsentPatch | null {
  if (decision === 'accepted') {
    return {
      consentStatus: 'confirmed',
      consentSource: 'self',
      consentBasis: 'self',
      consentRespondentName: account.displayName,
      consentConfirmedBy: account.id,
      consentConfirmedAt: at,
    };
  }
  if (profile.consentStatus === 'withdrawn') return null;
  if (profile.consentStatus === 'confirmed') {
    return { consentStatus: 'withdrawn', consentWithdrawnAt: at, consentWithdrawnBy: account.id };
  }
  return { consentStatus: 'declined' };
}
