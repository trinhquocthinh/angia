import { showsVitals, type SelfProfile } from '@angia/contracts';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import type { SelfProfileRow, SelfProfileScope } from './ports.js';

export const selfShowsVitals = (row: SelfProfileRow, now: () => Date) =>
  showsVitals(row, Number(medicationToday(now).slice(0, 4)));

type Outcome = { ok: true; value: SelfProfile } | { ok: false; code: 'ERR_NOT_FOUND' };

// SPEC-042: route duy nhất không qua cổng đồng thuận để giao diện giải thích trạng thái.
export function getSelfProfile(scope: SelfProfileScope, familyId: string, now: () => Date): Promise<Outcome> {
  return scope.withFamily(familyId, async (store) => {
    const row = await store.profile();
    if (!row) return { ok: false, code: 'ERR_NOT_FOUND' };
    const { id, displayName, birthYear, consentStatus } = row;
    return {
      ok: true,
      value: { id, displayName, birthYear, consentStatus, showsVitals: selfShowsVitals(row, now) },
    };
  });
}
