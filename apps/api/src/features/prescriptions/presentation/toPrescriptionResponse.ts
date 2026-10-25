import type { Prescription as PrescriptionResponse } from '@angia/contracts';
import type { Prescription } from '../domain/Prescription.js';

export function toPrescriptionResponse(prescription: Prescription): PrescriptionResponse {
  return { ...prescription, createdAt: prescription.createdAt.toISOString() };
}
