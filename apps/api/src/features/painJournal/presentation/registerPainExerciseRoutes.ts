import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import {
  createExerciseNoteRequestSchema,
  exerciseNoteSchema,
  updateExerciseNoteRequestSchema,
} from '@angia/contracts';
import { createExerciseNote } from '../application/createExerciseNote.js';
import { updateExerciseNote } from '../application/updateExerciseNote.js';
import { deleteExerciseNote } from '../application/deleteExerciseNote.js';
import type { PainJournalRouteDependencies } from './painJournalDependencies.js';
import { registerPainRoute } from './registerPainRoute.js';
import { painJournalHandler } from './painJournalHandler.js';
export function registerPainExerciseRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: PainJournalRouteDependencies,
  self: boolean,
): void {
  const base = self ? '/api/me/profile/pain-issues' : '/api/health-profiles/{id}/pain-issues';
  registerPainRoute(
    app,
    'post',
    `${base}/{issueId}/exercises`,
    { body: createExerciseNoteRequestSchema },
    201,
    exerciseNoteSchema,
    painJournalHandler(deps, self, 201, ({ repository, target, body, now }) =>
      createExerciseNote(repository, target, body, now),
    ),
  );
  registerPainRoute(
    app,
    'patch',
    `${base}/{issueId}/exercises/{exerciseId}`,
    { body: updateExerciseNoteRequestSchema },
    200,
    exerciseNoteSchema,
    painJournalHandler(deps, self, 200, ({ repository, target, body, now }) =>
      updateExerciseNote(repository, target, body, now),
    ),
  );
  registerPainRoute(
    app,
    'delete',
    `${base}/{issueId}/exercises/{exerciseId}`,
    {},
    204,
    undefined,
    painJournalHandler(deps, self, 204, ({ repository, target }) => deleteExerciseNote(repository, target)),
  );
}
