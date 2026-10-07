import type { Measurement, MeasurementKind } from '../domain/Measurement.js';

interface MeasurementStore {
  profileExists(profileId: string): Promise<boolean>;
  /** Số đo đã duyệt, mới nhất trước (ngày đo, giờ đo rồi thời điểm ghi). */
  listMeasurements(profileId: string, kind?: MeasurementKind): Promise<Measurement[]>;
}
export interface MeasurementRepository {
  withFamily<T>(familyId: string, work: (store: MeasurementStore) => Promise<T>): Promise<T>;
}
