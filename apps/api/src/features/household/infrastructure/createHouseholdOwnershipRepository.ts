import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdOwnershipRepository } from '../application/ownershipPorts.js';
import { lockHouseholdOwnership } from './lockHouseholdOwnership.js';
import { offerStoredHouseholdOwnership } from './offerStoredHouseholdOwnership.js';
import { decideStoredHouseholdOwnership } from './decideStoredHouseholdOwnership.js';

import { readCurrentHouseholdOwnershipOffer } from './readCurrentHouseholdOwnershipOffer.js';

export function createHouseholdOwnershipRepository(db: Database): HouseholdOwnershipRepository {
  return {
    current: (actor) =>
      withFamilyScope(db, actor.familyId, (tx) => readCurrentHouseholdOwnershipOffer(tx, actor)),
    offer: (actor, targetId) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const locked = await lockHouseholdOwnership(tx, actor);
        if (!locked.ok) return locked;
        return offerStoredHouseholdOwnership(tx, actor, targetId, locked);
      }),
    decide: (actor, offerId, accept) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const locked = await lockHouseholdOwnership(tx, actor);
        if (!locked.ok) return locked;
        return decideStoredHouseholdOwnership(tx, actor, offerId, accept ? 'accept' : 'decline', locked);
      }),
    revoke: (actor, offerId) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const locked = await lockHouseholdOwnership(tx, actor);
        if (!locked.ok) return locked;
        return decideStoredHouseholdOwnership(tx, actor, offerId, 'revoke', locked);
      }),
  };
}
