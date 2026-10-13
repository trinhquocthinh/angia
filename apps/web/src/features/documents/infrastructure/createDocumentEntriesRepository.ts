import { documentEntryPageSchema, reusePrescriptionResponseSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { DocumentEntriesRepository } from '../application/documentEntryPorts';
import { readReviewResponse } from './readReviewResponse';

export function createDocumentEntriesRepository(client = apiClient): DocumentEntriesRepository {
  return {
    page: async (profileId, { type, cursor }, signal) =>
      documentEntryPageSchema.parse(
        await readReviewResponse(
          await client.GET('/api/health-profiles/{id}/document-entries', {
            params: {
              path: { id: profileId },
              query: { ...(type ? { type } : {}), ...(cursor ? { cursor } : {}) },
            },
            signal: signal ?? null,
          }),
        ),
      ),
    reuse: async (profileId, prescriptionId, request, csrfToken) =>
      reusePrescriptionResponseSchema.parse(
        await readReviewResponse(
          await client.POST('/api/health-profiles/{id}/prescriptions/{prescriptionId}/reuse', {
            params: { path: { id: profileId, prescriptionId } },
            // Zod infer có optional undefined; kiểu OpenAPI chỉ nhận trường có giá trị khi hiện diện.
            body: {
              startDate: request.startDate,
              items: request.items.map(({ resolution, expectedConflictCourseIds, ...item }) => ({
                ...item,
                ...(resolution !== undefined ? { resolution } : {}),
                ...(expectedConflictCourseIds !== undefined ? { expectedConflictCourseIds } : {}),
              })),
            },
            headers: { 'X-CSRF-Token': csrfToken },
          }),
        ),
      ).courses,
  };
}
