import type { Database } from '@src/shared/db/createDatabase.js';
import { withSelfScope } from '@src/shared/db/withSelfScope.js';
import { drizzlePainIssueRepository } from './drizzlePainIssueRepository.js';

export function createPainJournalDependencies(db: Database) {
  return {
    repository: drizzlePainIssueRepository(db),
    forProfile: (profileId: string) =>
      drizzlePainIssueRepository(db, (scopedDb, familyId, work) =>
        withSelfScope(scopedDb, { familyId, profileId }, work),
      ),
  };
}
