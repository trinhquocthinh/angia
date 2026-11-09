import { exerciseCreateBody } from './exerciseNoteRequestBody';
import { exerciseUpdateBody } from './exerciseNotePatchBody';
import { exerciseNoteSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { ExerciseNoteWriter } from '../application/ports';
import { readPainJournalResponse } from './readPainJournalResponse';
export const createExerciseNoteApi = (client = apiClient): ExerciseNoteWriter => ({
  createExercise: async (profileId, issueId, body, csrf, signal) => {
    const options = {
      body: exerciseCreateBody(body),
      headers: { 'X-CSRF-Token': csrf },
      cache: 'no-store' as const,
      ...(signal ? { signal } : {}),
    };
    const result =
      profileId === null
        ? await client.POST('/api/me/profile/pain-issues/{issueId}/exercises', {
            ...options,
            params: { path: { issueId } },
          })
        : await client.POST('/api/health-profiles/{id}/pain-issues/{issueId}/exercises', {
            ...options,
            params: { path: { id: profileId, issueId } },
          });
    return exerciseNoteSchema.parse(readPainJournalResponse(result));
  },
  updateExercise: async (profileId, issueId, exerciseId, body, csrf, signal) => {
    const options = {
      body: exerciseUpdateBody(body),
      headers: { 'X-CSRF-Token': csrf },
      cache: 'no-store' as const,
      ...(signal ? { signal } : {}),
    };
    const result =
      profileId === null
        ? await client.PATCH('/api/me/profile/pain-issues/{issueId}/exercises/{exerciseId}', {
            ...options,
            params: { path: { issueId, exerciseId } },
          })
        : await client.PATCH('/api/health-profiles/{id}/pain-issues/{issueId}/exercises/{exerciseId}', {
            ...options,
            params: { path: { id: profileId, issueId, exerciseId } },
          });
    return exerciseNoteSchema.parse(readPainJournalResponse(result));
  },
});
