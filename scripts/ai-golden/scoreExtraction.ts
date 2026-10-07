import type { ExtractionPayload } from '@angia/contracts';
import { flattenFields } from './flattenFields.js';
import { normalizeValue } from './normalizeValue.js';

// `note` là câu cách dùng nguyên văn: lệch một dấu câu đã tính sai, không phản ánh khả năng đọc liều.
// Model vẫn trích nhưng không tính vào ngưỡng R1 (chốt 2026-10-04).
const isScored = (path: string): boolean => !path.endsWith('.note');

const scoredFields = (payload: ExtractionPayload): Map<string, unknown> =>
  new Map([...flattenFields(payload)].filter(([path]) => isScored(path)));

export interface FieldScore {
  correct: number;
  total: number;
  mismatches: string[];
}

/**
 * Chấm theo trường so với đáp án. Mẫu số là hợp các trường của đáp án và kết quả,
 * nên dòng bị bỏ sót lẫn dòng bịa thêm đều bị tính sai. `actual = null` (lỗi/sai schema) → 0 điểm.
 */
export const scoreExtraction = (
  expected: ExtractionPayload,
  actual: ExtractionPayload | null,
): FieldScore => {
  const expectedFields = scoredFields(expected);
  if (actual === null) return { correct: 0, total: expectedFields.size, mismatches: ['*'] };

  const actualFields = scoredFields(actual);
  const paths = new Set([...expectedFields.keys(), ...actualFields.keys()]);
  const mismatches = [...paths].filter(
    (path) =>
      !expectedFields.has(path) ||
      !actualFields.has(path) ||
      normalizeValue(expectedFields.get(path)) !== normalizeValue(actualFields.get(path)),
  );
  return { correct: paths.size - mismatches.length, total: paths.size, mismatches };
};
