import { painEntrySchema, updatePainEntryRequestSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { PainEntryEditor } from '../application/ports';
import { readPainJournalResponse } from './readPainJournalResponse';

export const createPainEntryEditorApi = (client = apiClient): PainEntryEditor => ({
  updateEntry: async (profileId, issueId, entryId, body, csrf, signal) => {
    const parsed = updatePainEntryRequestSchema.parse({
      ...body,
      ...(body.note === null ? { note: '' } : {}),
    });
    const options = {
      body: {
        ...(parsed.level !== undefined ? { level: parsed.level } : {}),
        ...(parsed.recordedAt !== undefined ? { recordedAt: parsed.recordedAt } : {}),
        ...(parsed.note !== undefined ? { note: parsed.note ?? '' } : {}),
      },
      headers: { 'X-CSRF-Token': csrf },
      cache: 'no-store' as const,
      ...(signal ? { signal } : {}),
    };
    const result =
      profileId === null
        ? await client.PATCH('/api/me/profile/pain-issues/{issueId}/entries/{entryId}', {
            ...options,
            params: { path: { issueId, entryId } },
          })
        : await client.PATCH('/api/health-profiles/{id}/pain-issues/{issueId}/entries/{entryId}', {
            ...options,
            params: { path: { id: profileId, issueId, entryId } },
          });
    return painEntrySchema.parse(readPainJournalResponse(result));
  },
  deleteEntry: async (profileId, issueId, entryId, csrf, signal) => {
    const options = {
      headers: { 'X-CSRF-Token': csrf },
      cache: 'no-store' as const,
      ...(signal ? { signal } : {}),
    };
    const result =
      profileId === null
        ? await client.DELETE('/api/me/profile/pain-issues/{issueId}/entries/{entryId}', {
            ...options,
            params: { path: { issueId, entryId } },
          })
        : await client.DELETE('/api/health-profiles/{id}/pain-issues/{issueId}/entries/{entryId}', {
            ...options,
            params: { path: { id: profileId, issueId, entryId } },
          });
    readPainJournalResponse(result);
  },
});
