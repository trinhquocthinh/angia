import type { ExerciseNote } from '@angia/contracts';
import type { ExerciseNoteValues } from './exerciseNoteForm';
export function initialExerciseNoteValues(exercise?: ExerciseNote, now = new Date()): ExerciseNoteValues {
  return {
    name: exercise?.name ?? '',
    source: exercise?.source ?? '',
    prescriber: exercise?.prescriber ?? '',
    startDate:
      exercise?.startDate ??
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now),
    endDate: exercise?.endDate ?? '',
    note: exercise?.note ?? '',
  };
}
