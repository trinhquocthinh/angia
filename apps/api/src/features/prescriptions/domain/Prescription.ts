export type DoseSlot = 'morning' | 'noon' | 'afternoon' | 'evening';

interface PrescriptionItem {
  id: string;
  name: string;
  strength: string | null;
  quantityPerDose: number;
  doseUnit: string | null;
  slots: DoseSlot[];
  durationDays: number | null;
  longTerm: boolean;
  note: string | null;
  totalQuantity: number | null;
}

export interface Prescription {
  id: string;
  healthProfileId: string;
  sourceDocumentId: string | null;
  issuedDate: string;
  facility: string | null;
  diagnosis: string | null;
  manualWithoutSource: boolean;
  createdAt: Date;
  items: PrescriptionItem[];
}

type NewPrescriptionItem = Omit<PrescriptionItem, 'id'>;
export type NewPrescription = Omit<Prescription, 'id' | 'createdAt' | 'items'> & {
  items: NewPrescriptionItem[];
};
