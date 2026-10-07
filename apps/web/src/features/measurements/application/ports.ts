import type { components } from '@src/shared/api/schema.gen';

export type Measurement = components['schemas']['Measurement'];
export type MeasurementKind = Measurement['kind'];

export interface MeasurementsRepository {
  list(profileId: string, kind: MeasurementKind, signal?: AbortSignal): Promise<Measurement[]>;
}
