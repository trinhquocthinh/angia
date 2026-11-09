import type { ExerciseNoteValues } from './exerciseNoteForm';
export function changeExerciseNoteValues(
  values: ExerciseNoteValues,
  patch: Partial<ExerciseNoteValues>,
): ExerciseNoteValues {
  const next = { ...values, ...patch };
  return { ...next, prescriber: next.source === 'self' ? '' : next.prescriber };
}
