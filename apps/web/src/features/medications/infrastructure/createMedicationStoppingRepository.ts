import { medicationCourseSchema, stoppableCoursesSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import type { MedicationStoppingRepository } from '../application/stoppingPorts';
import { readStoppingResponse } from './readStoppingResponse';
export function createMedicationStoppingRepository(client = apiClient): MedicationStoppingRepository {
  return {
    list: async (profileId, signal) =>
      stoppableCoursesSchema.parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/medication-courses/stoppable', {
            params: { path: { id: profileId } },
            ...(signal ? { signal } : {}),
          }),
        ),
      ),
    stop: async (profileId, courseId, request, csrf) =>
      medicationCourseSchema.parse(
        readStoppingResponse(
          await client.POST('/api/health-profiles/{id}/medication-courses/{courseId}/stop', {
            params: { path: { id: profileId, courseId } },
            body: request,
            headers: { 'X-CSRF-Token': csrf },
          }),
        ),
      ),
  };
}
