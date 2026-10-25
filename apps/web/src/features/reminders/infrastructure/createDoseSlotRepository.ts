import { doseSlotListSchema } from '@angia/contracts';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import { apiClient } from '@src/shared/api/apiClient';
import type { DoseSlotRepository } from '../application/ports';

export function createDoseSlotRepository(client = apiClient): DoseSlotRepository {
  return {
    get: async (profileId, signal) =>
      doseSlotListSchema.parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/dose-slots', {
            params: { path: { id: profileId } },
            ...(signal ? { signal } : {}),
          }),
          'Không thể tải khung giờ nhắc. Vui lòng thử lại.',
        ),
      ),
    save: async (profileId, slots, csrfToken) =>
      doseSlotListSchema.parse(
        readStoppingResponse(
          await client.PUT('/api/health-profiles/{id}/dose-slots', {
            params: { path: { id: profileId } },
            body: { slots },
            headers: { 'X-CSRF-Token': csrfToken },
          }),
          'Không thể lưu khung giờ nhắc. Vui lòng thử lại.',
        ),
      ),
  };
}
