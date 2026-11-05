import type { HealthProfile as ProfileResponse } from '@angia/contracts';
import type { HealthProfile } from '../domain/HealthProfile.js';

// Ánh xạ tường minh từng trường của hợp đồng; không trải nguyên hàng DB (tránh lộ cột nội bộ).
export function toProfileResponse(profile: HealthProfile): ProfileResponse {
  return {
    id: profile.id,
    familyId: profile.familyId,
    displayName: profile.displayName,
    birthYear: profile.birthYear,
    vitalsEnabled: profile.vitalsEnabled,
    consentConfirmedAt: profile.consentConfirmedAt?.toISOString() ?? null,
    consentConfirmedBy: profile.consentConfirmedBy,
    consentBasis: profile.consentBasis,
    consentStatus: profile.consentStatus,
    consentSource: profile.consentSource,
    consentRespondentName: profile.consentRespondentName,
    createdAt: profile.createdAt.toISOString(),
  };
}
