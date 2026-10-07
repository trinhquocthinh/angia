import type { HealthProfile as ProfileResponse } from '@angia/contracts';
import type { HealthProfile } from '../domain/HealthProfile.js';

export function toProfileResponse(profile: HealthProfile): ProfileResponse {
  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    consentConfirmedAt: profile.consentConfirmedAt?.toISOString() ?? null,
  };
}
