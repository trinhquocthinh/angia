import { documentDeletionImpactSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { ReviewRepository } from '../application/reviewPorts';
import { readReviewResponse } from './readReviewResponse';

const QUEUE_STATUSES = [
  'uploaded',
  'extracting',
  'pending_review',
  'manual_entry',
  'awaiting_budget',
] as const;

export function createReviewRepository(client = apiClient): ReviewRepository {
  return {
    queue: async (cursor, signal) =>
      readReviewResponse(
        await client.GET('/api/source-documents', {
          params: { query: { status: [...QUEUE_STATUSES], ...(cursor ? { cursor } : {}) } },
          signal: signal ?? null,
        }),
      ),
    review: async (id, signal) =>
      readReviewResponse(
        await client.GET('/api/source-documents/{id}/review', {
          params: { path: { id } },
          signal: signal ?? null,
        }),
      ),
    deletionImpact: async (id, signal) =>
      documentDeletionImpactSchema.parse(
        await readReviewResponse(
          await client.GET('/api/source-documents/{id}/deletion-impact', {
            params: { path: { id } },
            signal: signal ?? null,
          }),
        ),
      ),
    deleteDocument: async (id, csrfToken) => {
      const result = await client.DELETE('/api/source-documents/{id}', {
        params: { path: { id } },
        body: { confirm: 'XÓA' },
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (!result.response.ok) await readReviewResponse(result);
    },
    approve: async (id, body, csrfToken) =>
      readReviewResponse(
        await client.POST('/api/source-documents/{id}/approve', {
          params: { path: { id } },
          body,
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
    createManualRecords: async (profileId, body, csrfToken) =>
      readReviewResponse(
        await client.POST('/api/health-profiles/{id}/manual-records', {
          params: { path: { id: profileId } },
          body,
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
  };
}

// Ảnh đọc qua API cùng cookie phiên; <img> không gửi CSRF nên route là GET.
export const documentImageUrl = (id: string) => `/api/source-documents/${id}/image`;
