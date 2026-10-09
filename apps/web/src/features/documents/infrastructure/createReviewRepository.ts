import { apiClient } from '@src/shared/api/apiClient';
import type { ReviewRepository } from '../application/reviewPorts';
import { readReviewResponse } from './readReviewResponse';

const QUEUE_STATUSES = [
  'uploaded',
  'awaiting_privacy',
  'extracting',
  'pending_review',
  'manual_entry',
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
    approve: async (id, body, csrfToken) =>
      readReviewResponse(
        await client.POST('/api/source-documents/{id}/approve', {
          params: { path: { id } },
          body,
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
    reject: async (id, csrfToken) =>
      readReviewResponse(
        await client.POST('/api/source-documents/{id}/reject', {
          params: { path: { id } },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
  };
}

// Ảnh đọc qua API cùng cookie phiên; <img> không gửi CSRF nên route là GET.
export const documentImageUrl = (id: string, variant: 'preview' | 'original' = 'preview') =>
  `/api/source-documents/${id}/image?variant=${variant}`;
