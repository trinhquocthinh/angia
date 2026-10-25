import type { LabResult as LabResultResponse } from '@angia/contracts';
import type { LabResult } from '../domain/LabResult.js';

export function toLabResultResponse(result: LabResult): LabResultResponse {
  return { ...result, createdAt: result.createdAt.toISOString() };
}
