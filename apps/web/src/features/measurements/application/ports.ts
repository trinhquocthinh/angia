import type { components } from '@src/shared/api/schema.gen';

export type Measurement = components['schemas']['Measurement'];
type MeasurementPage = components['schemas']['MeasurementPage'];
export type MeasurementKind = Measurement['kind'];

export interface MeasurementsRepository {
  /** F09a: một trang số đo, mới nhất trước; `cursor` là id số đo cuối của trang trước. */
  list(
    profileId: string,
    kind: MeasurementKind,
    cursor: string | null,
    signal?: AbortSignal,
  ): Promise<MeasurementPage>;
}
