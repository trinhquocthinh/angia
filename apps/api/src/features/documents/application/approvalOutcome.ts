import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';
import type { SourceDocument } from '../domain/SourceDocument.js';

export interface ApprovedRecords {
  document: SourceDocument;
  measurements: Measurement[];
  prescription: Prescription | null;
  labResults: LabResult[];
}
type ApproveError =
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_VALIDATION' | 'ERR_INVALID_STATE_TRANSITION' }
  | { ok: false; code: 'ERR_DOCUMENT_DATE_REQUIRED' | 'ERR_BP_INVALID' | 'ERR_GLUCOSE_UNIT_REQUIRED' }
  | { ok: false; code: 'ERR_OUT_OF_RANGE_UNCONFIRMED'; fields: string[] }
  | { ok: false; code: 'ERR_DOSE_INFO_MISSING'; invalidItemIndexes: number[] };
export type ApproveOutcome = { ok: true; value: ApprovedRecords } | ApproveError;

export const approved = (
  document: SourceDocument,
  records: Partial<Omit<ApprovedRecords, 'document'>>,
): ApproveOutcome => ({
  ok: true,
  value: { document, measurements: [], prescription: null, labResults: [], ...records },
});

export const DATE_REQUIRED = { ok: false, code: 'ERR_DOCUMENT_DATE_REQUIRED' } as const;
