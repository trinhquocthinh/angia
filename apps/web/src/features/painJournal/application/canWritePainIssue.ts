import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
export function canWritePainIssue(session: ProfileSession, profile: HealthProfile, scope: 'main' | 'self') {
  return (
    Boolean(session.family && session.csrfToken) &&
    session.family?.id === profile.familyId &&
    profile.consentStatus === 'confirmed' &&
    (scope === 'self' ? session.account.healthProfileId === profile.id : session.role === 'main')
  );
}
