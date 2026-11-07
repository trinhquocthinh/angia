import { updateExerciseNoteRequestSchema, type UpdateExerciseNoteRequest } from '@angia/contracts';
export function exerciseUpdateBody(body: UpdateExerciseNoteRequest) {
  const parsed = updateExerciseNoteRequestSchema.parse(body);
  return {
    ...(parsed.name === undefined ? {} : { name: parsed.name }),
    ...(parsed.source === undefined ? {} : { source: parsed.source }),
    ...(parsed.prescriber === undefined ? {} : { prescriber: parsed.prescriber }),
    ...(parsed.startDate === undefined ? {} : { startDate: parsed.startDate }),
    ...(parsed.endDate === undefined ? {} : { endDate: parsed.endDate }),
    ...(parsed.note === undefined ? {} : { note: parsed.note }),
  };
}
