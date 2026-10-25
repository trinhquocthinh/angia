import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import type { AdherenceClock, AdherenceRepository, ListAdherenceOutcome } from './ports.js';

// Danh sách cho Bottom Sheet ghi nhận (E5-S3-T2): kèm hôm nay theo Việt Nam làm mốc tối đa.
export function listAdherencePeriods(
  repository: AdherenceRepository,
  familyId: string,
  profileId: string,
  now: AdherenceClock,
): Promise<ListAdherenceOutcome> {
  return repository.withFamily(familyId, async (store) => {
    const profile = await store.findProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    return { ok: true, value: { today: medicationToday(now), periods: await store.listPeriods(profileId) } };
  });
}
