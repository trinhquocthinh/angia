import { currentMedicationsSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { MedicationCatalogRepository } from '../application/catalogPorts';
import { readStoppingResponse } from './readStoppingResponse';
export function createMedicationCatalogRepository(client = apiClient): MedicationCatalogRepository {
  return {
    current: async (profileId, signal) =>
      currentMedicationsSchema.parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/medication-courses/current', {
            params: { path: { id: profileId } },
            ...(signal ? { signal } : {}),
          }),
          'Không thể tải danh mục thuốc. Vui lòng thử lại.',
        ),
      ),
  };
}
