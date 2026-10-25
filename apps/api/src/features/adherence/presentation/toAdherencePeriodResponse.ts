import { adherencePeriodSchema, type AdherencePeriod as AdherencePeriodResponse } from '@angia/contracts';
import type { AdherencePeriod } from '../domain/AdherencePeriod.js';

// Liệt kê tường minh trường trả về: không lộ tên chuẩn hóa hay người ghi.
export function toAdherencePeriodResponse(period: AdherencePeriod): AdherencePeriodResponse {
  return adherencePeriodSchema.parse({
    id: period.id,
    healthProfileId: period.healthProfileId,
    medicationName: period.medicationName,
    status: period.status,
    fromDate: period.fromDate,
    toDate: period.toDate,
  });
}
