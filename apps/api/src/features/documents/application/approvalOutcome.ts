import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';
import type { SourceDocument } from '../domain/SourceDocument.js';

export interface ClinicalRecords {
  measurements: Measurement[];
  prescription: Prescription | null;
  labResults: LabResult[];
}
export interface ApprovedRecords extends ClinicalRecords {
  document: SourceDocument;
}
export type ApproveError =
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_VALIDATION' | 'ERR_INVALID_STATE_TRANSITION' }
  | { ok: false; code: 'ERR_DOCUMENT_DATE_REQUIRED' | 'ERR_BP_INVALID' | 'ERR_GLUCOSE_UNIT_REQUIRED' }
  | { ok: false; code: 'ERR_OUT_OF_RANGE_UNCONFIRMED'; fields: string[] }
  | { ok: false; code: 'ERR_DOSE_INFO_MISSING'; invalidItemIndexes: number[] };
export type ApproveOutcome = { ok: true; value: ApprovedRecords } | ApproveError;

/** Bản ghi đã lưu kèm ngày ghi nhận (ngày đo/kê/trả kết quả) để cập nhật ngày chứng từ. */
export type SaveOutcome =
  { ok: true; value: { records: ClinicalRecords; recordDate: string } } | ApproveError;

/** BR-014: bản ghi gắn chứng từ gốc, hoặc `sourceDocumentId = null` khi nhập tay không kèm chứng từ. */
export interface RecordTarget {
  healthProfileId: string;
  sourceDocumentId: string | null;
}

export const saved = (recordDate: string, records: Partial<ClinicalRecords>): SaveOutcome => ({
  ok: true,
  value: { recordDate, records: { measurements: [], prescription: null, labResults: [], ...records } },
});

export const provenance = (target: RecordTarget) => ({
  healthProfileId: target.healthProfileId,
  sourceDocumentId: target.sourceDocumentId,
  manualWithoutSource: target.sourceDocumentId === null,
});

export const DATE_REQUIRED = { ok: false, code: 'ERR_DOCUMENT_DATE_REQUIRED' } as const;
