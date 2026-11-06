import { painIssues } from '@src/shared/db/schema/index.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { type FamilyScope, withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';
import type { PainIssueRepository } from '../application/ports.js';
import { painIssueWhere } from './painIssueWhere.js';
import { findStoredPainIssue } from './findStoredPainIssue.js';
import { findTrackingPainIssue } from './findTrackingPainIssue.js';
import { readPainSummaries } from './readPainSummaries.js';
import { readPainDetail } from './readPainDetail.js';
import { insertStoredPainIssue } from './insertStoredPainIssue.js';
import { updateStoredPainIssue } from './updateStoredPainIssue.js';
import { changeStoredPainStatus } from './changeStoredPainStatus.js';
import { countPainImpact } from './countPainImpact.js';
import { firstPainRecordedAt } from './firstPainRecordedAt.js';
import { painEntryStore } from './painEntryStore.js';
import { exerciseNoteStore } from './exerciseNoteStore.js';
import { drizzlePainContextReader } from './drizzlePainContextReader.js';

export function drizzlePainIssueRepository(
  db: Database,
  scope: FamilyScope = withFamilyScope,
): PainIssueRepository {
  return {
    withFamily: (familyId, work) =>
      scope(db, familyId, (tx) =>
        work({
          findProfile: (id) => findProfileInFamily(tx, familyId, id),
          findIssue: (profileId, issueId, lock) =>
            findStoredPainIssue(tx, familyId, profileId, issueId, lock),
          findTrackingIssue: (profileId, location, exclude) =>
            findTrackingPainIssue(tx, familyId, profileId, location, exclude),
          listIssues: (profileId, status) => readPainSummaries(tx, familyId, profileId, status),
          getDetail: (profileId, issueId) => readPainDetail(tx, familyId, profileId, issueId),
          insertIssue: (input) => insertStoredPainIssue(tx, familyId, input),
          updateIssue: (profileId, issueId, value, audit) =>
            updateStoredPainIssue(tx, familyId, profileId, issueId, value, audit),
          changeStatus: (profileId, issueId, value) =>
            changeStoredPainStatus(tx, familyId, profileId, issueId, value),
          countImpact: (profileId, issueId) => countPainImpact(tx, familyId, profileId, issueId),
          firstRecordedAt: (profileId, issueId) => firstPainRecordedAt(tx, familyId, profileId, issueId),
          readContext: (profileId, from, to) => drizzlePainContextReader(tx, familyId, profileId, from, to),
          deleteIssue: async (profileId, issueId) => {
            await tx.delete(painIssues).where(painIssueWhere(familyId, profileId, issueId));
          },
          ...painEntryStore(tx, familyId),
          ...exerciseNoteStore(tx, familyId),
        }),
      ),
  };
}
