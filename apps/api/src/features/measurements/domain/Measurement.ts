// Tên loại theo hợp đồng API (SDD §2.1, SPEC-020); cột DB dùng `blood_glucose`, hạ tầng tự ánh xạ.
export type MeasurementKind = 'blood_pressure' | 'glucose';
export type GlucoseUnit = 'mmol/L' | 'mg/dL';

export interface MeasurementValues {
  kind: MeasurementKind;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  glucoseValue: number | null;
  glucoseUnit: GlucoseUnit | null;
}

export interface Measurement extends MeasurementValues {
  id: string;
  healthProfileId: string;
  sourceDocumentId: string | null;
  measuredOn: string;
  measuredTime: string | null;
  manualWithoutSource: boolean;
  createdAt: Date;
}

export type NewMeasurement = Omit<Measurement, 'id' | 'createdAt'>;
