import { describe, expect, it } from 'vitest';
import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import { pickLatestLabResults } from './pickLatestLabResults.js';

const result = (id: string, testName: string, resultDate: string, createdAt = '2026-10-01T00:00:00Z') =>
  ({
    id,
    healthProfileId: 'p',
    sourceDocumentId: null,
    resultDate,
    testName,
    value: '7.1',
    unit: '%',
    referenceRange: null,
    facility: null,
    manualWithoutSource: true,
    createdAt: new Date(createdAt),
  }) satisfies LabResult;

describe('Kết quả xét nghiệm mới nhất từng chỉ số (SPEC-024, BR-034)', () => {
  it('TC-065: 2 lần HbA1c chỉ giữ đúng 1 kết quả mới nhất, gom theo tên chuẩn hóa', () => {
    const latest = pickLatestLabResults(
      [
        result('old', 'HbA1c', '2026-07-01'),
        result('new', 'hba1c', '2026-09-20'),
        result('creat', 'Creatinin', '2026-08-01'),
      ],
      '2026-10-16',
    );
    expect(latest.map((item) => item.id)).toEqual(['new', 'creat']);
  });

  it('bỏ kết quả sau ngày to, giữ kết quả cũ trước from; cùng ngày thì lấy bản ghi sau', () => {
    const latest = pickLatestLabResults(
      [
        result('before-range', 'Ure', '2025-01-01'),
        result('after-to', 'HbA1c', '2026-10-01'),
        result('in-range', 'HbA1c', '2026-09-01'),
        result('same-day-1', 'Glucose', '2026-09-05', '2026-09-05T01:00:00Z'),
        result('same-day-2', 'Glucose', '2026-09-05', '2026-09-05T02:00:00Z'),
      ],
      '2026-09-30',
    );
    expect(latest.map((item) => item.id)).toEqual(['same-day-2', 'in-range', 'before-range']);
  });
});
