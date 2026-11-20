import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ProfileGuardianRepository } from '../application/ports.js';
import { changeStoredProfileGuardian } from './changeStoredProfileGuardian.js';
import { listStoredProfileGuardians } from './listStoredProfileGuardians.js';
export function createProfileGuardianRepository(db: Database): ProfileGuardianRepository {
  return {
    list: (actor, profileId) =>
      withFamilyScope(db, actor.familyId, (tx) => listStoredProfileGuardians(tx, actor, profileId)),
    change: (actor, profileId, targetId) =>
      withFamilyScope(db, actor.familyId, (tx) =>
        changeStoredProfileGuardian(tx, actor, profileId, targetId),
      ),
  };
}
