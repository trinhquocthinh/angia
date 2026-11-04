import type { RecordTemperatureRequest, TemperatureList, TemperatureReading } from '@angia/contracts';

export type TemperatureRangeQuery = { from: string; to: string };
export interface TemperatureRepository {
  /** null dùng route tự xem, không gửi ID hồ sơ từ client. */
  list(
    profileId: string | null,
    query: TemperatureRangeQuery,
    signal?: AbortSignal,
  ): Promise<TemperatureList>;
  record(profileId: string, body: RecordTemperatureRequest, csrf: string): Promise<TemperatureReading>;
  remove(profileId: string, readingId: string, csrf: string): Promise<void>;
}
