import { createExerciseNoteRequestSchema, type ExerciseNote } from '@angia/contracts';
import { prepareExerciseNote } from '../domain/exerciseNote.js';
import type {
  IssueTarget,
  PainIssueClock,
  PainIssueOutcome,
  PainIssueRepository,
  PainIssueSession,
} from './ports.js';
import { loadPainIssue } from './loadPainIssue.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';
import { toExerciseNote } from './toExerciseNote.js';

export function createExerciseNote(
  repository: PainIssueRepository,
  session: PainIssueSession & IssueTarget,
  body: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<ExerciseNote>> {
  const at = now();
  return repository.withFamily(session.familyId, async (store) => {
    const loaded = await loadPainIssue(store, session, true);
    if (!loaded.ok) return loaded;
    const parsed = createExerciseNoteRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const prepared = prepareExerciseNote(
      {
        ...parsed.data,
        prescriber: parsed.data.prescriber ?? null,
        endDate: parsed.data.endDate ?? null,
        note: parsed.data.note ?? null,
      },
      'create',
    );
    if (!prepared.ok) return prepared;
    const value = await store.insertExercise(session.profileId, session.issueId, prepared.value, {
      accountId: session.accountId,
      at,
    });
    return { ok: true, value: toExerciseNote(value) };
  });
}
