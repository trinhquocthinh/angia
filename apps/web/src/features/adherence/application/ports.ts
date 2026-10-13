import type { components } from '@src/shared/api/schema.gen';

export type AdherencePeriod = components['schemas']['AdherencePeriod'];
export type AdherenceStatus = AdherencePeriod['status'];
export type AdherencePeriodList = components['schemas']['AdherencePeriodList'];
export type RecordAdherenceRequest = components['schemas']['RecordAdherencePeriodRequest'];

export interface AdherenceRepository {
  /** Giai đoạn của hồ sơ theo tên chuẩn hóa rồi mốc tăng dần, kèm hôm nay (Việt Nam). */
  list(profileId: string, signal?: AbortSignal): Promise<AdherencePeriodList>;
  /** SPEC-022: mở giai đoạn mới, API tự đóng giai đoạn đang mở của cùng thuốc. */
  record(profileId: string, request: RecordAdherenceRequest, csrf: string): Promise<AdherencePeriod>;
}
