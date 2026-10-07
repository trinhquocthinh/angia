import type { HealthProfile, NewProfile, ProfileOutcome } from '../domain/HealthProfile.js';
import type { Clock, ProfileRepository } from './ports.js';

export async function createProfile(
  repository: ProfileRepository,
  familyId: string,
  input: NewProfile,
  now: Clock,
): Promise<ProfileOutcome<HealthProfile>> {
  const displayName = input.displayName.trim();
  const year = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(now()),
  );
  if (
    !displayName ||
    displayName.length > 60 ||
    (input.birthYear !== undefined &&
      (!Number.isInteger(input.birthYear) || input.birthYear < 1900 || input.birthYear > year))
  ) {
    return { ok: false, code: 'ERR_VALIDATION' };
  }
  return repository.withFamily(familyId, async (store) => {
    if (input.linkedAccountId) {
      const account = await store.lockAccount(input.linkedAccountId);
      if (!account) return { ok: false, code: 'ERR_NOT_FOUND' };
      if (account.healthProfileId) return { ok: false, code: 'ERR_PROFILE_ALREADY_LINKED' };
    }
    const profile = await store.insertProfile({ ...input, displayName });
    if (input.linkedAccountId) await store.linkAccount(input.linkedAccountId, profile.id);
    return { ok: true, value: profile };
  });
}
