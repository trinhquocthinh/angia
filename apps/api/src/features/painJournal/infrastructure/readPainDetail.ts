import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { readPainSummaries } from './readPainSummaries.js';
import { readPainEntries } from './readPainEntries.js';
import { readExerciseNotes } from './readExerciseNotes.js';
import { readPainStatusEvents } from './readPainStatusEvents.js';

export async function readPainDetail(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
) {
  const summary = (await readPainSummaries(tx, familyId, profileId, 'all', issueId))[0];
  if (!summary) return null;
  return {
    ...summary,
    entries: await readPainEntries(tx, familyId, profileId, issueId),
    exercises: await readExerciseNotes(tx, familyId, profileId, issueId),
    statusEvents: await readPainStatusEvents(tx, familyId, profileId, issueId),
  };
}
