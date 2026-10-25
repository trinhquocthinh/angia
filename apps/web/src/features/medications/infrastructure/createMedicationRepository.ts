import { apiClient } from '@src/shared/api/apiClient';
import type { MedicationRepository } from '../application/ports';
import { readMedicationResponse } from './readMedicationResponse';
export function createMedicationRepository(client = apiClient): MedicationRepository {
  return {
    create: async (profileId, request, csrf) =>
      readMedicationResponse(
        await client.POST('/api/health-profiles/{id}/medication-courses', {
          params: { path: { id: profileId } },
          // Zod infer có optional undefined; kiểu OpenAPI chỉ nhận trường có giá trị khi hiện diện.
          body: {
            name: request.name,
            doseUnit: request.doseUnit,
            startDate: request.startDate,
            ...(request.strength !== undefined ? { strength: request.strength } : {}),
            ...(request.quantityPerDose !== undefined ? { quantityPerDose: request.quantityPerDose } : {}),
            ...(request.slots !== undefined ? { slots: request.slots } : {}),
            ...(request.resolution !== undefined ? { resolution: request.resolution } : {}),
            ...(request.expectedConflictCourseIds !== undefined
              ? { expectedConflictCourseIds: request.expectedConflictCourseIds }
              : {}),
          },
          headers: { 'X-CSRF-Token': csrf },
        }),
      ),
  };
}
