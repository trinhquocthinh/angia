import { checkMeasurement } from '@src/features/measurements/domain/checkMeasurement.js';
import { pickMeasurementValues } from '@src/features/measurements/domain/pickMeasurementValues.js';
import type { DeviceReadingDraft } from './approvalDrafts.js';
import { DATE_REQUIRED, provenance, saved, type RecordTarget, type SaveOutcome } from './approvalOutcome.js';
import { findMeasurementDuplicate } from './findDuplicateRecord.js';
import type { ReviewStore } from './reviewPorts.js';

// SPEC-010 + SPEC-019: ngày đo bắt buộc → khoảng khả dĩ → kiểm trùng (SPEC-012) → lưu số đo.
export async function saveDeviceReading(
  store: ReviewStore,
  target: RecordTarget,
  data: DeviceReadingDraft,
  confirm: { outOfRange: boolean; duplicate: boolean },
): Promise<SaveOutcome> {
  const { measuredAt, measuredTime } = data;
  if (!measuredAt) return DATE_REQUIRED;
  const values = pickMeasurementValues(data);
  const check = checkMeasurement(values, confirm.outOfRange);
  if (!check.ok) return check;
  const reading = { values, measuredOn: measuredAt, measuredTime };
  const duplicate = confirm.duplicate
    ? null
    : await findMeasurementDuplicate(store, target.healthProfileId, reading);
  if (duplicate) return duplicate;
  const measurement = await store.insertMeasurement({
    ...values,
    ...provenance(target),
    measuredOn: measuredAt,
    measuredTime,
  });
  return saved(measuredAt, { measurements: [measurement] });
}
