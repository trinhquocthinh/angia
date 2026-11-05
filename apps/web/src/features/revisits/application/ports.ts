import type { RevisitList } from '@angia/contracts';
export type RevisitPrescription = RevisitList[number]['prescriptions'][number];
export interface RevisitRepository {
  list(profileId: string, signal?: AbortSignal): Promise<RevisitList>;
  setDate(
    profileId: string,
    prescriptionId: string,
    revisitDate: string | null,
    csrf: string,
  ): Promise<{ revisitDate: string | null }>;
}
