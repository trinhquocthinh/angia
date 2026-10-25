import type { GlucoseUnit } from './Measurement.js';

// SDD §2.2: khoảng kiểm tra lỗi nhập liệu (BR-021), không phải ngưỡng lâm sàng; hai đầu mút hợp lệ.
export const PLAUSIBILITY_LIMITS = {
  systolic: { min: 60, max: 260 },
  diastolic: { min: 30, max: 160 },
  pulse: { min: 30, max: 220 },
} as const;

// Đường huyết so theo đơn vị gốc (BR-020): 1.0–35.0 mmol/L tương ứng 18–630 mg/dL.
export const GLUCOSE_LIMITS: Record<GlucoseUnit, { min: number; max: number }> = {
  'mmol/L': { min: 1, max: 35 },
  'mg/dL': { min: 18, max: 630 },
};
