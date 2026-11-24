import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdLeaveRepository } from '../application/leavePorts.js';
import { leaveHouseholdInTx } from './leaveHouseholdInTx.js';

export function createHouseholdLeaveRepository(db: Database, boss: PgBoss): HouseholdLeaveRepository {
  return {
    leave: (actor, input) =>
      withFamilyScope(db, actor.familyId, (tx) => leaveHouseholdInTx(tx, boss, actor, input)),
  };
}
