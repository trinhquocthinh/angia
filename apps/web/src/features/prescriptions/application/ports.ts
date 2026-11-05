import type { PrescriptionDetail, PrescriptionListItem } from '@angia/contracts';

export interface PrescriptionRepository {
  list(profileId: string, signal?: AbortSignal): Promise<PrescriptionListItem[]>;
  detail(profileId: string, prescriptionId: string, signal?: AbortSignal): Promise<PrescriptionDetail>;
}
