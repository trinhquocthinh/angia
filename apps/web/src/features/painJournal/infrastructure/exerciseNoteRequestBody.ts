import { createExerciseNoteRequestSchema, type CreateExerciseNoteRequest } from '@angia/contracts';
export function exerciseCreateBody(body: CreateExerciseNoteRequest) {
  const parsed = createExerciseNoteRequestSchema.parse(body);
  return {
    name: parsed.name,
    source: parsed.source,
    startDate: parsed.startDate,
    ...(parsed.prescriber === undefined ? {} : { prescriber: parsed.prescriber }),
    ...(parsed.endDate === undefined ? {} : { endDate: parsed.endDate }),
    ...(parsed.note === undefined ? {} : { note: parsed.note }),
  };
}
