import { asNeededDoseSchema, type AsNeededDose as AsNeededDoseResponse } from '@angia/contracts';
import type { AsNeededDose } from '../domain/AsNeededDose.js';

export function toAsNeededDoseResponse(dose: AsNeededDose): AsNeededDoseResponse {
  return asNeededDoseSchema.parse({
    ...dose,
    givenAt: dose.givenAt.toISOString(),
    recordedAt: dose.recordedAt.toISOString(),
  });
}
