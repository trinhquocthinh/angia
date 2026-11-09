import type { ExerciseTarget, PainIssueOutcome, PainIssueRepository } from './ports.js';
import { loadExerciseNote } from './loadExerciseNote.js';

export function deleteExerciseNote(
  repository: PainIssueRepository,
  target: ExerciseTarget,
): Promise<PainIssueOutcome<null>> {
  return repository.withFamily(target.familyId, async (store) => {
    const loaded = await loadExerciseNote(store, target);
    if (!loaded.ok) return loaded;
    await store.deleteExercise(target.profileId, target.issueId, target.exerciseId);
    return { ok: true, value: null };
  });
}
