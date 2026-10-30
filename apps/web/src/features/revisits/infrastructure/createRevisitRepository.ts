import { revisitListSchema, setRevisitDateSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import type { RevisitRepository } from '../application/ports';

export function createRevisitRepository(client = apiClient): RevisitRepository {
  return {
    list: async (profileId, signal) =>
      revisitListSchema.parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/revisits', {
            params: { path: { id: profileId } },
            cache: 'no-store',
            ...(signal ? { signal } : {}),
          }),
          'Không thể tải lịch tái khám. Vui lòng thử lại.',
        ),
      ),
    setDate: async (profileId, prescriptionId, revisitDate, csrf) =>
      setRevisitDateSchema.parse(
        readStoppingResponse(
          await client.PUT('/api/health-profiles/{id}/prescriptions/{prescriptionId}/revisit-date', {
            params: { path: { id: profileId, prescriptionId } },
            body: { revisitDate },
            headers: { 'X-CSRF-Token': csrf },
          }),
          'Không thể lưu ngày hẹn. Vui lòng thử lại.',
        ),
      ),
  };
}
