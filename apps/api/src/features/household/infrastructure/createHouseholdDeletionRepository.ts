import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdDeletionRepository } from '../application/deletionPorts.js';
import { lockHouseholdOwnership } from './lockHouseholdOwnership.js';
import { requestStoredHouseholdDeletion } from './requestStoredHouseholdDeletion.js';
import { revokeStoredHouseholdDeletion } from './revokeStoredHouseholdDeletion.js';

// Khoá account → family → yêu cầu, cùng thứ tự với trao quyền và job execute-family-deletion.
export function createHouseholdDeletionRepository(db: Database): HouseholdDeletionRepository {
  return {
    request: (actor, name) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const locked = await lockHouseholdOwnership(tx, actor);
        if (!locked.ok) return locked;
        return requestStoredHouseholdDeletion(tx, actor, name, locked, new Date());
      }),
    revoke: (actor, requestId) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const locked = await lockHouseholdOwnership(tx, actor);
        if (!locked.ok) return locked;
        return revokeStoredHouseholdDeletion(tx, actor, requestId, new Date());
      }),
  };
}
