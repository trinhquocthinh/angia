import { prescriptionDetailSchema, prescriptionListItemSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import type { PrescriptionRepository } from '../application/ports';

export function createPrescriptionRepository(client = apiClient): PrescriptionRepository {
  const fallback = 'Không thể tải đơn thuốc. Vui lòng thử lại.';
  return {
    list: async (profileId, signal) =>
      prescriptionListItemSchema.array().parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/prescriptions', {
            params: { path: { id: profileId } },
            cache: 'no-store',
            signal: signal ?? null,
          }),
          fallback,
        ),
      ),
    detail: async (profileId, prescriptionId, signal) =>
      prescriptionDetailSchema.parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/prescriptions/{prescriptionId}', {
            params: { path: { id: profileId, prescriptionId } },
            cache: 'no-store',
            signal: signal ?? null,
          }),
          fallback,
        ),
      ),
  };
}
