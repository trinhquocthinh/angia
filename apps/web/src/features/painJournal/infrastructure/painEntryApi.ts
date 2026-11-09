import {
  createPainEntryRequestSchema,
  painEntrySchema,
  painIssueDetailSchema,
  painIssueSummarySchema,
} from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { PainEntryWriter, PainIssueReader } from '../application/ports';
import { readPainJournalResponse } from './readPainJournalResponse';

export const createPainEntryApi = (client = apiClient): PainEntryWriter & PainIssueReader => ({
  record: async (profileId, issueId, body, csrf, signal) => {
    const entry = createPainEntryRequestSchema.parse(body);
    const options = {
      body: {
        level: entry.level,
        ...(entry.note != null ? { note: entry.note } : {}),
        ...(entry.recordedAt !== undefined ? { recordedAt: entry.recordedAt } : {}),
      },
      headers: { 'X-CSRF-Token': csrf },
      cache: 'no-store' as const,
      ...(signal ? { signal } : {}),
    };
    const result =
      profileId === null
        ? await client.POST('/api/me/profile/pain-issues/{issueId}/entries', {
            ...options,
            params: { path: { issueId } },
          })
        : await client.POST('/api/health-profiles/{id}/pain-issues/{issueId}/entries', {
            ...options,
            params: { path: { id: profileId, issueId } },
          });
    return painEntrySchema.parse(readPainJournalResponse(result));
  },
  reopen: async (profileId, issueId, csrf, signal) => {
    const options = {
      body: {},
      headers: { 'X-CSRF-Token': csrf },
      cache: 'no-store' as const,
      ...(signal ? { signal } : {}),
    };
    const result =
      profileId === null
        ? await client.POST('/api/me/profile/pain-issues/{issueId}/reopen', {
            ...options,
            params: { path: { issueId } },
          })
        : await client.POST('/api/health-profiles/{id}/pain-issues/{issueId}/reopen', {
            ...options,
            params: { path: { id: profileId, issueId } },
          });
    return painIssueSummarySchema.parse(readPainJournalResponse(result));
  },
  detail: async (profileId, issueId, signal) => {
    const options = { cache: 'no-store' as const, ...(signal ? { signal } : {}) };
    const result =
      profileId === null
        ? await client.GET('/api/me/profile/pain-issues/{issueId}', {
            ...options,
            params: { path: { issueId } },
          })
        : await client.GET('/api/health-profiles/{id}/pain-issues/{issueId}', {
            ...options,
            params: { path: { id: profileId, issueId } },
          });
    return painIssueDetailSchema.parse(readPainJournalResponse(result));
  },
});
