import type { components } from '@src/shared/api/schema.gen';

export type Measurement = components['schemas']['Measurement'];
type MeasurementPage = components['schemas']['MeasurementPage'];
export type MeasurementSeries = components['schemas']['MeasurementSeries'];
export type SeriesPoint = components['schemas']['MeasurementSeriesPoint'];
export type MeasurementKind = Measurement['kind'];

export interface MeasurementsRepository {
  /** F09a: một trang số đo, mới nhất trước; `cursor` là id số đo cuối của trang trước. */
  list(
    profileId: string,
    kind: MeasurementKind,
    cursor: string | null,
    signal?: AbortSignal,
  ): Promise<MeasurementPage>;
  /** SPEC-020: chuỗi số đo trong [from, to], cũ nhất trước; đường huyết hiển thị mmol/L. */
  series(
    profileId: string,
    kind: MeasurementKind,
    range: { from: string; to: string },
    signal?: AbortSignal,
  ): Promise<MeasurementSeries>;
}
