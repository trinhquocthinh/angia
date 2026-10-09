import { checkMeasurement } from '@src/features/measurements/domain/checkMeasurement.js';
import { pickMeasurementValues } from '@src/features/measurements/domain/pickMeasurementValues.js';
import type { SourceDocument } from '../domain/SourceDocument.js';
import type { DeviceReadingDraft } from './approvalDrafts.js';
import { approved, DATE_REQUIRED, type ApproveOutcome } from './approvalOutcome.js';
import type { ReviewStore } from './reviewPorts.js';

// SPEC-010 + SPEC-019: ngày đo bắt buộc → khoảng khả dĩ → lưu số đo gắn chứng từ.
export async function approveDeviceReading(
  store: ReviewStore,
  document: SourceDocument,
  data: DeviceReadingDraft,
  confirmOutOfRange: boolean,
): Promise<ApproveOutcome> {
  const { measuredAt, measuredTime } = data;
  if (!measuredAt) return DATE_REQUIRED;
  const values = pickMeasurementValues(data);
  const check = checkMeasurement(values, confirmOutOfRange);
  if (!check.ok) return check;
  const measurement = await store.insertMeasurement({
    ...values,
    healthProfileId: document.healthProfileId,
    sourceDocumentId: document.id,
    measuredOn: measuredAt,
    measuredTime,
    manualWithoutSource: false,
  });
  return approved(await store.markApproved(document.id, measuredAt), { measurements: [measurement] });
}
