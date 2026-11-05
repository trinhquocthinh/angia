import type { Prescription } from './Prescription.js';

type Item = Prescription['items'][number];
type ComparedField =
  'strength' | 'quantityPerDose' | 'doseUnit' | 'slots' | 'durationDays' | 'longTerm' | 'externalUse';
export type PrescriptionFieldChange =
  | {
      [K in ComparedField]: { field: K; before: Item[K]; after: Item[K] };
    }[ComparedField]
  | { field: 'lines'; before: Item[]; after: Item[] };

export interface PrescriptionDiff {
  added: { name: string; items: Item[] }[];
  removed: { name: string; items: Item[] }[];
  changed: { name: string; changes: PrescriptionFieldChange[] }[];
}
