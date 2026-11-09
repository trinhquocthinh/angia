import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { ExerciseNote } from '@angia/contracts';
import type { ExerciseTarget, PainIssueOutcome, PainIssueStore, StoredPainIssue } from './ports.js';

export async function loadExerciseNote(
  store: PainIssueStore,
  target: ExerciseTarget,
): Promise<PainIssueOutcome<StoredPainIssue & { exercise: ExerciseNote }>> {
  const found = await store.findIssue(target.profileId, target.issueId, true);
  if (!found || found.issue.healthProfileId !== target.profileId || found.issue.id !== target.issueId) {
    return { ok: false, code: 'ERR_NOT_FOUND' };
  }
  const exercise = await store.findExercise(target.profileId, target.issueId, target.exerciseId);
  if (!exercise || exercise.id !== target.exerciseId) return { ok: false, code: 'ERR_NOT_FOUND' };
  const blocked = consentGate(found.consentStatus);
  return blocked ? { ok: false, code: blocked } : { ok: true, value: { ...found, exercise } };
}
