import { checkMeasurement } from '@src/features/measurements/domain/checkMeasurement.js';
import type { Measurement, MeasurementValues } from '@src/features/measurements/domain/Measurement.js';
import { pickMeasurementValues } from '@src/features/measurements/domain/pickMeasurementValues.js';
import type { SourceDocument } from '../domain/SourceDocument.js';
import type { ReviewRepository, ReviewStore } from './reviewPorts.js';

interface DeviceReadingDraft extends MeasurementValues {
  type: 'device_reading';
  measuredAt: string | null;
  measuredTime: string | null;
}
export interface ApproveRequest {
  familyId: string;
  documentId: string;
  type: 'device_reading';
  data: DeviceReadingDraft;
  confirmOutOfRange?: boolean | undefined;
}
type ApproveError =
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_VALIDATION' | 'ERR_INVALID_STATE_TRANSITION' }
  | { ok: false; code: 'ERR_DOCUMENT_DATE_REQUIRED' | 'ERR_BP_INVALID' | 'ERR_GLUCOSE_UNIT_REQUIRED' }
  | { ok: false; code: 'ERR_OUT_OF_RANGE_UNCONFIRMED'; fields: string[] };
export type ApproveOutcome =
  { ok: true; value: { document: SourceDocument; measurements: Measurement[] } } | ApproveError;

// SPEC-010: khóa chứng từ → FSM (chỉ từ pending_review) → ngày bắt buộc → SPEC-019 → ghi số đo + approved.
// Kiểm trùng lặp (SPEC-012) thuộc E3-S5-T1. Ảnh gốc trên S3 không bị đụng tới.
export async function approveDocument(
  repository: ReviewRepository,
  request: ApproveRequest,
): Promise<ApproveOutcome> {
  return repository.withFamily(request.familyId, (store) => approveInStore(store, request));
}

async function approveInStore(store: ReviewStore, request: ApproveRequest): Promise<ApproveOutcome> {
  const document = await store.findDocument(request.documentId, { lock: true });
  if (!document) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (document.status !== 'pending_review') return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  if (document.type !== request.type) return { ok: false, code: 'ERR_VALIDATION' };
  const { measuredAt, measuredTime } = request.data;
  if (!measuredAt) return { ok: false, code: 'ERR_DOCUMENT_DATE_REQUIRED' };
  const values = pickMeasurementValues(request.data);
  const check = checkMeasurement(values, request.confirmOutOfRange ?? false);
  if (!check.ok) return check;
  const measurement = await store.insertMeasurement({
    ...values,
    healthProfileId: document.healthProfileId,
    sourceDocumentId: document.id,
    measuredOn: measuredAt,
    measuredTime,
    manualWithoutSource: false,
  });
  const approved = await store.markApproved(document.id, measuredAt);
  return { ok: true, value: { document: approved, measurements: [measurement] } };
}
