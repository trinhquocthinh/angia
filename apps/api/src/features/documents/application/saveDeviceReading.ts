import { checkMeasurement } from '@src/features/measurements/domain/checkMeasurement.js';
import { pickMeasurementValues } from '@src/features/measurements/domain/pickMeasurementValues.js';
import type { DeviceReadingDraft } from './approvalDrafts.js';
import { DATE_REQUIRED, provenance, saved, type RecordTarget, type SaveOutcome } from './approvalOutcome.js';
import type { ReviewStore } from './reviewPorts.js';

// SPEC-010 + SPEC-019: ngày đo bắt buộc → khoảng khả dĩ → lưu số đo.
export async function saveDeviceReading(
  store: ReviewStore,
  target: RecordTarget,
  data: DeviceReadingDraft,
  confirmOutOfRange: boolean,
): Promise<SaveOutcome> {
  const { measuredAt, measuredTime } = data;
  if (!measuredAt) return DATE_REQUIRED;
  const values = pickMeasurementValues(data);
  const check = checkMeasurement(values, confirmOutOfRange);
  if (!check.ok) return check;
  const measurement = await store.insertMeasurement({
    ...values,
    ...provenance(target),
    measuredOn: measuredAt,
    measuredTime,
  });
  return saved(measuredAt, { measurements: [measurement] });
}
