import type { ApprovedDocumentResponse } from '@angia/contracts';
import { toLabResultResponse } from '@src/features/labResults/presentation/toLabResultResponse.js';
import { toMeasurementResponse } from '@src/features/measurements/presentation/toMeasurementResponse.js';
import { toPrescriptionResponse } from '@src/features/prescriptions/presentation/toPrescriptionResponse.js';
import type { ApprovedRecords } from '../application/approvalOutcome.js';
import { toSourceDocumentResponse } from './toSourceDocumentResponse.js';

export function toApprovedDocumentResponse(records: ApprovedRecords): ApprovedDocumentResponse {
  return {
    document: toSourceDocumentResponse(records.document),
    measurements: records.measurements.map(toMeasurementResponse),
    prescription: records.prescription && toPrescriptionResponse(records.prescription),
    labResults: records.labResults.map(toLabResultResponse),
  };
}
