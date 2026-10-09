import type { ApprovedDocumentResponse, ManualRecordsResponse } from '@angia/contracts';
import { toLabResultResponse } from '@src/features/labResults/presentation/toLabResultResponse.js';
import { toMeasurementResponse } from '@src/features/measurements/presentation/toMeasurementResponse.js';
import { toPrescriptionResponse } from '@src/features/prescriptions/presentation/toPrescriptionResponse.js';
import type { ApprovedRecords, ClinicalRecords } from '../application/approvalOutcome.js';
import { toSourceDocumentResponse } from './toSourceDocumentResponse.js';

export function toClinicalRecordsResponse(records: ClinicalRecords): ManualRecordsResponse {
  return {
    measurements: records.measurements.map(toMeasurementResponse),
    prescription: records.prescription && toPrescriptionResponse(records.prescription),
    labResults: records.labResults.map(toLabResultResponse),
  };
}

export function toApprovedDocumentResponse(records: ApprovedRecords): ApprovedDocumentResponse {
  return { document: toSourceDocumentResponse(records.document), ...toClinicalRecordsResponse(records) };
}
