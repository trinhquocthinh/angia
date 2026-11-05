import type { UpdateHealthProfileRequest } from '@angia/contracts';
import type { HealthProfile, ProfileOutcome } from '../domain/HealthProfile.js';
import { isValidBirthYear } from '../domain/isValidBirthYear.js';
import type { Clock, ProfileRepository } from './ports.js';

export async function updateProfile(
  repository: ProfileRepository,
  familyId: string,
  profileId: string,
  input: UpdateHealthProfileRequest,
  now: Clock,
): Promise<ProfileOutcome<HealthProfile, 'ERR_NOT_FOUND' | 'ERR_VALIDATION' | 'ERR_CONSENT_REQUIRED'>> {
  if (
    (input.birthYear === undefined && input.vitalsEnabled === undefined) ||
    (input.birthYear !== undefined && !isValidBirthYear(input.birthYear, now()))
  ) {
    return { ok: false, code: 'ERR_VALIDATION' };
  }
  return repository.withFamily(familyId, async (store) => {
    const profile = await store.lockProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus === 'withdrawn') {
      return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    }
    const patch = {
      ...(input.birthYear !== undefined ? { birthYear: input.birthYear } : {}),
      ...(input.vitalsEnabled !== undefined
        ? { vitalsEnabled: input.vitalsEnabled ? (true as const) : null }
        : {}),
    };
    return { ok: true, value: await store.updateProfile(profileId, patch) };
  });
}
