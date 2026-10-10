import type { MeasurementValues } from '@src/features/measurements/domain/Measurement.js';
import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';

/** SPEC-012: tập khóa nội dung đã chuẩn hóa, sắp xếp và bỏ lặp — không kể thứ tự dòng trên chứng từ. */
export type ContentFingerprint = readonly string[];

// Hàm lượng/giá trị: chuẩn hóa như tên rồi bỏ hết khoảng trắng để "5 mg" khớp "5mg" (owner chốt 2026-10-09).
const compact = (text: string | null) => normalizeName(text ?? '').replace(/\s/g, '');
const toSet = (keys: string[]): ContentFingerprint => [...new Set(keys)].sort();

export const prescriptionFingerprint = (items: { name: string; strength: string | null }[]) =>
  toSet(items.map((item) => `${normalizeName(item.name)}|${compact(item.strength)}`));

export const labResultFingerprint = (items: { testName: string; value: string }[]) =>
  toSet(items.map((item) => `${normalizeName(item.testName)}|${compact(item.value)}`));

// Giờ đo so riêng ở isDuplicate vì "nếu có" không phải là một phần của giá trị.
export const measurementFingerprint = (values: MeasurementValues): ContentFingerprint => [
  [
    values.kind,
    values.systolic,
    values.diastolic,
    values.pulse,
    values.glucoseValue,
    values.glucoseUnit,
  ].join('|'),
];
