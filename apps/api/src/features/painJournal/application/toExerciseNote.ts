import type { ExerciseNote } from '@angia/contracts';
import { toPainActor } from './toPainActor.js';

export function toExerciseNote(exercise: ExerciseNote): ExerciseNote {
  return {
    id: exercise.id,
    name: exercise.name,
    source: exercise.source,
    prescriber: exercise.prescriber,
    startDate: exercise.startDate,
    endDate: exercise.endDate,
    note: exercise.note,
    createdBy: toPainActor(exercise.createdBy),
    updatedBy: toPainActor(exercise.updatedBy),
    updatedAt: exercise.updatedAt,
  };
}
