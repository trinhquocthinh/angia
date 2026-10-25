import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { AdherencePeriod } from '@src/features/adherence/domain/AdherencePeriod.js';
import type { Measurement, MeasurementKind } from '../domain/Measurement.js';

/** F09a: số bản tối đa của một trang và id số đo cuối trang trước. */
export interface MeasurementPageRequest {
  limit: number;
  cursor?: string | undefined;
}
export interface MeasurementPage {
  items: Measurement[];
  nextCursor: string | null;
}
interface MeasurementStore {
  /** Trạng thái đồng thuận của hồ sơ; null = không có trong gia đình. */
  profileConsent(profileId: string): Promise<ConsentStatus | null>;
  /** Số đo đã duyệt, mới nhất trước (ngày đo, giờ đo — chưa có giờ ở cuối ngày, thời điểm ghi, id). */
  listMeasurementPage(
    profileId: string,
    kind: MeasurementKind | undefined,
    page: MeasurementPageRequest,
  ): Promise<MeasurementPage>;
  /** SPEC-020: số đo đã duyệt có ngày đo trong [from, to], cũ nhất trước (thứ tự ngược với trang). */
  listMeasurementsBetween(
    profileId: string,
    kind: MeasurementKind,
    from: string,
    to: string,
  ): Promise<Measurement[]>;
  /** SPEC-023: giai đoạn dùng thuốc giao với [from, to], theo tên chuẩn hóa rồi mốc tăng dần. */
  listAdherencePeriodsBetween(profileId: string, from: string, to: string): Promise<AdherencePeriod[]>;
}
export interface MeasurementRepository {
  withFamily<T>(familyId: string, work: (store: MeasurementStore) => Promise<T>): Promise<T>;
}
