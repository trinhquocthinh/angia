import { and, eq } from 'drizzle-orm';
import { profileGuardians } from '@src/shared/db/schema/index.js';
import { clearProfileGuardians } from './clearProfileGuardians.js';
import type { ProfileStore } from '../../application/ports.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { lockGuardianAccounts } from './lockGuardianAccounts.js';
import { recordCreatorGuardian } from './recordCreatorGuardian.js';
export function createProfileGuardianStore(
  tx: FamilyScopedTx,
  familyId: string,
): Pick<
  ProfileStore,
  'prepareGuardianCreator' | 'addCreatorGuardian' | 'clearProfileGuardians' | 'hasProfileGuardian'
> {
  return {
    hasProfileGuardian: async (id) =>
      (
        await tx
          .select({ id: profileGuardians.accountId })
          .from(profileGuardians)
          .where(and(eq(profileGuardians.familyId, familyId), eq(profileGuardians.healthProfileId, id)))
          .limit(1)
      ).length > 0,
    clearProfileGuardians: (id, actorId) => clearProfileGuardians(tx, familyId, id, actorId),
    prepareGuardianCreator: async (actorId) => (await lockGuardianAccounts(tx, familyId, actorId)).allowed,
    addCreatorGuardian: (id, actorId) => recordCreatorGuardian(tx, familyId, id, actorId),
  };
}
