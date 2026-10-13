import { adherencePeriods } from '@src/shared/db/schema/index.js';

// Cột ánh xạ trực tiếp sang AdherencePeriod; không đọc family_id/recorded_by ra tầng trên.
export const adherencePeriodColumns = {
  id: adherencePeriods.id,
  healthProfileId: adherencePeriods.healthProfileId,
  medicationName: adherencePeriods.medicationName,
  medicationNameNormalized: adherencePeriods.medicationNameNormalized,
  status: adherencePeriods.status,
  fromDate: adherencePeriods.fromDate,
  toDate: adherencePeriods.toDate,
};
