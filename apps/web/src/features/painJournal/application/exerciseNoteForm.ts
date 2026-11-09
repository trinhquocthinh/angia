import { createExerciseNoteRequestSchema, updateExerciseNoteRequestSchema } from '@angia/contracts';
export type ExerciseNoteValues = {
  name: string;
  source: string;
  prescriber: string;
  startDate: string;
  endDate: string;
  note: string;
};
export function exerciseNoteForm(values: ExerciseNoteValues, editing: boolean) {
  if (!values.name.trim()) throw new Error('Vui lòng nhập tên bài tập.');
  const body = {
    name: values.name,
    source: values.source,
    startDate: values.startDate,
    note: values.note,
    ...(values.source === 'prescribed' ? { prescriber: values.prescriber } : {}),
    ...(values.endDate ? { endDate: values.endDate } : {}),
  };
  const parsed = createExerciseNoteRequestSchema.parse(body);
  return editing
    ? updateExerciseNoteRequestSchema.parse({ ...parsed, endDate: values.endDate || null })
    : parsed;
}
