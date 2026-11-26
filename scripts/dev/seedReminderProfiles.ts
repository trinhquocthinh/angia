import type { FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import { healthProfiles, profileGuardians } from '../../apps/api/src/shared/db/schema/index.js';
import { reminderSeedId } from './reminderSeedId.js';

export async function seedReminderProfiles(
  tx: FamilyScopedTx,
  familyId: string,
  actorIds: string[],
  now: Date,
) {
  const full = reminderSeedId(familyId, 'profile-full');
  const empty = reminderSeedId(familyId, 'profile-empty');
  const minor = reminderSeedId(familyId, 'profile-minor');
  await tx
    .insert(healthProfiles)
    .values(
      [
        { id: full, displayName: 'Mẫu UI · Có lời nhắc', birthYear: 1965 },
        { id: empty, displayName: 'Mẫu UI · Chưa thiết lập', birthYear: 1985 },
        {
          id: minor,
          displayName: 'Mẫu UI · Bé An',
          birthYear:
            Number(
              new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(now),
            ) - 6,
        },
      ].map((profile) => ({
        ...profile,
        familyId,
        consentStatus: 'confirmed' as const,
        consentConfirmedAt: now,
        consentConfirmedBy: actorIds[0]!,
        consentBasis: (profile.id === minor ? 'guardian' : 'self') as 'guardian' | 'self',
        consentSource: 'main_attested' as const,
        consentRespondentName: 'Người thân mẫu UI',
      })),
    )
    .onConflictDoNothing();
  await tx
    .insert(profileGuardians)
    .values(
      actorIds.slice(0, 2).map((accountId) => ({
        familyId,
        healthProfileId: minor,
        accountId,
      })),
    )
    .onConflictDoNothing();
  return { full, empty, minor };
}
