import type { FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import { withFamilyScope } from '../../apps/api/src/shared/db/withFamilyScope.js';
import { seedReminderProfiles } from './seedReminderProfiles.js';
import { seedReminderMedicationData } from './seedReminderMedicationData.js';
import { seedReminderRevisitData } from './seedReminderRevisitData.js';
import { seedLinkedReminderProfiles } from './seedLinkedReminderProfiles.js';

type Actor = {
  id: string;
  familyId: string | null;
  username: string | null;
  role: string | null;
  profileId: string | null;
};

export async function seedReminderFamily(
  tx: FamilyScopedTx,
  familyId: string,
  actors: Actor[],
  now: Date,
  date: string,
) {
  return withFamilyScope(tx, familyId, async (scoped) => {
    const mainIds = actors.filter((a) => a.role === 'main').map((a) => a.id);
    if (!mainIds.length) throw new Error('Cần tài khoản main cùng gia đình trong danh sách seed.');
    const profiles = await seedReminderProfiles(scoped, familyId, mainIds, now);
    const medication = await seedReminderMedicationData(scoped, familyId, profiles.full, mainIds, date, now);
    const revisit = await seedReminderRevisitData(scoped, familyId, profiles.full, date, now, true);
    const revisitEmpty = await seedReminderRevisitData(scoped, familyId, profiles.empty, date, now, false);
    const linked = await seedLinkedReminderProfiles(scoped, familyId, actors, date, now);
    return {
      usernames: actors.map((actor) => actor.username),
      date,
      paths: {
        empty: `/profiles/${profiles.empty}/reminders`,
        full: `/profiles/${profiles.full}/reminders`,
        minor: `/profiles/${profiles.minor}/reminders`,
        pending: `/reminders/${medication.pending}`,
        confirmed: `/reminders/${medication.confirmed}`,
        revisit: `/revisit-reminders/${revisit}`,
        revisitEmpty: `/revisit-reminders/${revisitEmpty}`,
      },
      linked,
    };
  });
}
