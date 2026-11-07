import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
export function painIssueWriteKey(session: ProfileSession, profile: HealthProfile, scope: 'main' | 'self') {
  return JSON.stringify([
    session.account.id,
    session.family?.id,
    session.account.healthProfileId,
    session.role,
    profile.id,
    profile.familyId,
    profile.consentStatus,
    scope,
  ]);
}
