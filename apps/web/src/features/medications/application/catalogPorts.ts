import type { CurrentMedications } from '@angia/contracts';
export interface MedicationCatalogRepository {
  current(profileId: string, signal?: AbortSignal): Promise<CurrentMedications>;
}
