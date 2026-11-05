import { asNeededDoseListSchema, asNeededDoseSchema, courseIntervalSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import type { AsNeededDoseRepository } from '../application/ports';

export function createAsNeededDoseRepository(client = apiClient): AsNeededDoseRepository {
  return {
    list: async (profileId, query, signal) => {
      const options = { cache: 'no-store' as const, ...(signal ? { signal } : {}) };
      const response =
        profileId === null
          ? await client.GET('/api/me/profile/as-needed-doses', { ...options, params: { query } })
          : await client.GET('/api/health-profiles/{id}/as-needed-doses', {
              ...options,
              params: { path: { id: profileId }, query },
            });
      return asNeededDoseListSchema.parse(
        readStoppingResponse(response, 'Không thể tải nhật ký liều. Vui lòng thử lại.'),
      );
    },
    record: async (profileId, body, csrf) =>
      asNeededDoseSchema.parse(
        readStoppingResponse(
          await client.POST('/api/health-profiles/{id}/as-needed-doses', {
            params: { path: { id: profileId } },
            body,
            headers: { 'X-CSRF-Token': csrf },
          }),
          'Không thể lưu liều. Vui lòng thử lại.',
        ),
      ),
    remove: async (profileId, doseId, csrf) => {
      readStoppingResponse(
        await client.DELETE('/api/health-profiles/{id}/as-needed-doses/{doseId}', {
          params: { path: { id: profileId, doseId } },
          headers: { 'X-CSRF-Token': csrf },
        }),
        'Không thể xóa bản ghi. Vui lòng thử lại.',
      );
    },
    setInterval: async (profileId, courseId, text, csrf) =>
      courseIntervalSchema.parse(
        readStoppingResponse(
          await client.PUT('/api/health-profiles/{id}/medication-courses/{courseId}/interval', {
            params: { path: { id: profileId, courseId } },
            body: { text },
            headers: { 'X-CSRF-Token': csrf },
          }),
          'Không thể lưu khoảng cách. Vui lòng thử lại.',
        ),
      ),
  };
}
