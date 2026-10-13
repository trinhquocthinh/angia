import { describe, expect, it } from 'vitest';
import type { LabResult } from './LabResult.js';
import { groupLabSeries } from './groupLabSeries.js';

let sequence = 0;
const result = (testName: string, resultDate: string, extra: Partial<LabResult> = {}): LabResult => {
  sequence += 1;
  return {
    id: `r-${String(sequence).padStart(3, '0')}`,
    healthProfileId: 'me',
    sourceDocumentId: 'doc-1',
    resultDate,
    testName,
    value: '7.1',
    unit: '%',
    referenceRange: '4.0 - 6.0',
    facility: null,
    manualWithoutSource: false,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    ...extra,
  };
};

describe('groupLabSeries — SPEC-021, BR-022', () => {
  it('TC-060 — "HbA1c" và "hba1c" tại 3 ngày gom thành 01 nhóm "HbA1c", 3 kết quả theo thứ tự ngày', () => {
    const groups = groupLabSeries([
      result('hba1c', '2026-06-12'),
      result('HbA1c', '2026-10-01'),
      result('HbA1c', '2026-01-05'),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.testName).toBe('HbA1c');
    expect(groups[0]!.results.map((r) => r.resultDate)).toEqual(['2026-01-05', '2026-06-12', '2026-10-01']);
  });

  it('TC-061 — phiếu không in khoảng tham chiếu: referenceRange giữ null, không tự gắn chuẩn', () => {
    const [group] = groupLabSeries([result('Creatinin', '2026-10-01', { referenceRange: null, unit: null })]);
    expect(group!.results[0]).toMatchObject({ referenceRange: null, unit: null, value: '7.1' });
  });

  it('TC-256 — tên nhóm lấy nguyên văn lần mới nhất; trùng ngày xếp theo thời điểm lưu rồi id', () => {
    const [group] = groupLabSeries([
      result('HBA1C', '2026-10-01', { createdAt: new Date('2026-10-02T09:00:00Z') }),
      result('HbA1c', '2026-10-01', { createdAt: new Date('2026-10-02T08:00:00Z') }),
      result('hba1c', '2026-03-01'),
    ]);
    expect(group!.testName).toBe('HBA1C');
    expect(group!.results.map((r) => r.testName)).toEqual(['hba1c', 'HbA1c', 'HBA1C']);
    const tie = groupLabSeries([
      result('ure', '2026-10-01', { id: 'b' }),
      result('Ure', '2026-10-01', { id: 'a' }),
    ]);
    expect(tie[0]!.results.map((r) => r.id)).toEqual(['a', 'b']);
    expect(tie[0]!.testName).toBe('ure');
  });

  it('TC-257 — nhóm có kết quả mới nhất trước; cùng ngày mới nhất xếp theo tên A→Z không phân biệt dấu', () => {
    const groups = groupLabSeries([
      result('Glucose', '2026-06-12'),
      result('Đường huyết đói', '2026-10-01'),
      result('Cholesterol', '2026-10-01'),
      result('Glucose', '2026-01-05'),
      result('Ure', '2026-08-20'),
    ]);
    expect(groups.map((g) => g.testName)).toEqual(['Cholesterol', 'Đường huyết đói', 'Ure', 'Glucose']);
  });

  it('không có kết quả → mảng rỗng', () => {
    expect(groupLabSeries([])).toEqual([]);
  });
});
