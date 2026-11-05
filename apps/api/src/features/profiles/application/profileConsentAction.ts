import type { ProfileListItem } from '@angia/contracts';
import type { HealthProfile } from '../domain/HealthProfile.js';

export function profileConsentAction(
  profile: HealthProfile,
  linkedAccountId: string | null,
  actorId: string,
): ProfileListItem['consentAction'] {
  if (profile.consentStatus === 'confirmed') return null;
  if (profile.consentWithdrawnAt !== null || profile.consentStatus === 'withdrawn') {
    return linkedAccountId === null ? null : 'invitation';
  }
  if (linkedAccountId === null) return 'attestation';
  return linkedAccountId === actorId ? 'self' : 'invitation';
}
