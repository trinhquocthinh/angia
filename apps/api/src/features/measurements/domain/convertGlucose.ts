import type { GlucoseUnit } from './Measurement.js';

const MG_PER_MMOL = 18;

// BR-020, SDD §2.2: quy đổi chỉ để hiển thị (mg/dL = mmol/L × 18); DB giữ nguyên đơn vị gốc.
// Cùng đơn vị → giữ nguyên giá trị gốc; khác đơn vị → mmol/L 1 số lẻ, mg/dL số nguyên.
export function convertGlucose(value: number, from: GlucoseUnit, to: GlucoseUnit): number {
  if (from === to) return value;
  return to === 'mmol/L' ? Math.round((value / MG_PER_MMOL) * 10) / 10 : Math.round(value * MG_PER_MMOL);
}
