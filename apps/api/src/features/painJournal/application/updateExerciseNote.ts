import { updateExerciseNoteRequestSchema, type ExerciseNote } from '@angia/contracts';
import { prepareExerciseNote } from '../domain/exerciseNote.js';
import type {
  ExerciseTarget,
  PainIssueClock,
  PainIssueOutcome,
  PainIssueRepository,
  PainIssueSession,
} from './ports.js';
import { loadExerciseNote } from './loadExerciseNote.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';
import { toExerciseNote } from './toExerciseNote.js';

export function updateExerciseNote(
  repository: PainIssueRepository,
  session: PainIssueSession & ExerciseTarget,
  body: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<ExerciseNote>> {
  const at = now();
  return repository.withFamily(session.familyId, async (store) => {
    const loaded = await loadExerciseNote(store, session);
    if (!loaded.ok) return loaded;
    const parsed = updateExerciseNoteRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const { exercise } = loaded.value;
    const prepared = prepareExerciseNote(
      {
        name: parsed.data.name ?? exercise.name,
        source: parsed.data.source ?? exercise.source,
        prescriber: parsed.data.prescriber ?? exercise.prescriber,
        startDate: parsed.data.startDate ?? exercise.startDate,
        endDate: parsed.data.endDate ?? exercise.endDate,
        note: parsed.data.note ?? exercise.note,
      },
      'update',
    );
    if (!prepared.ok) return prepared;
    const value = await store.updateExercise(
      session.profileId,
      session.issueId,
      session.exerciseId,
      prepared.value,
      { accountId: session.accountId, at },
    );
    return { ok: true, value: toExerciseNote(value) };
  });
}
