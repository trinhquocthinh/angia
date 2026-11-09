import {
  painIssueDeletionImpactSchema,
  painIssueSummarySchema,
  resolvePainIssueRequestSchema,
} from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { PainIssueLifecycleApi } from '../application/ports';
import { readPainJournalResponse } from './readPainJournalResponse';

export const createPainIssueLifecycleApi = (client = apiClient): PainIssueLifecycleApi => ({
  resolve: async (profileId, issueId, body, csrf, signal) => {
    const options = {
      body: resolvePainIssueRequestSchema.parse(body),
      headers: { 'X-CSRF-Token': csrf },
      cache: 'no-store' as const,
      ...(signal ? { signal } : {}),
    };
    const result =
      profileId === null
        ? await client.POST('/api/me/profile/pain-issues/{issueId}/resolve', {
            ...options,
            params: { path: { issueId } },
          })
        : await client.POST('/api/health-profiles/{id}/pain-issues/{issueId}/resolve', {
            ...options,
            params: { path: { id: profileId, issueId } },
          });
    return painIssueSummarySchema.parse(readPainJournalResponse(result));
  },
  deletionImpact: async (profileId, issueId, signal) => {
    const options = { cache: 'no-store' as const, ...(signal ? { signal } : {}) };
    const result =
      profileId === null
        ? await client.GET('/api/me/profile/pain-issues/{issueId}/deletion-impact', {
            ...options,
            params: { path: { issueId } },
          })
        : await client.GET('/api/health-profiles/{id}/pain-issues/{issueId}/deletion-impact', {
            ...options,
            params: { path: { id: profileId, issueId } },
          });
    return painIssueDeletionImpactSchema.parse(readPainJournalResponse(result));
  },
  deleteIssue: async (profileId, issueId, csrf, signal) => {
    const options = {
      body: { confirm: true as const },
      headers: { 'X-CSRF-Token': csrf },
      cache: 'no-store' as const,
      ...(signal ? { signal } : {}),
    };
    const result =
      profileId === null
        ? await client.DELETE('/api/me/profile/pain-issues/{issueId}', {
            ...options,
            params: { path: { issueId } },
          })
        : await client.DELETE('/api/health-profiles/{id}/pain-issues/{issueId}', {
            ...options,
            params: { path: { id: profileId, issueId } },
          });
    readPainJournalResponse(result);
  },
});
