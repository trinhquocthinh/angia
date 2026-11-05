import type { RevisitList } from '@angia/contracts';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { RevisitOutcome, RevisitRepository } from './revisitPorts.js';

export function listRevisits(
  repository: RevisitRepository,
  familyId: string,
  profileId: string,
  from: string | undefined,
  now: () => Date,
): Promise<RevisitOutcome<RevisitList>> {
  return repository.withFamily(familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    return { ok: true, value: await store.listRevisits(profileId, from ?? medicationToday(now)) };
  });
}
