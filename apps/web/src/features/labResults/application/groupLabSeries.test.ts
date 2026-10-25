import { describe, expect, it } from 'vitest';
import type { LabResult, LabSeries } from '@angia/contracts';
import { groupLabSeries } from './groupLabSeries';

const result: LabResult = {
  id: 'a',
  healthProfileId: 'p',
  sourceDocumentId: null,
  resultDate: '2026-10-01',
  testName: 'X',
  value: '1',
  unit: null,
  referenceRange: null,
  facility: null,
  manualWithoutSource: true,
  createdAt: '2026-10-01T08:00:00.000Z',
};
const seriesOf = (testName: string): LabSeries => ({
  testName,
  results: [{ ...result, id: testName, testName }],
});

describe('groupLabSeries — SPEC-021, Design LG-01', () => {
  it('TC-396 — thứ tự nhóm cố định, bỏ nhóm rỗng, "Khác" cuối, trong nhóm giữ thứ tự API', () => {
    const groups = groupLabSeries(['Xét nghiệm X', 'Creatinin', 'HbA1c', 'Ure', 'Glucose'].map(seriesOf));
    expect(groups.map((group) => group.id)).toEqual(['glucose', 'kidney', 'other']);
    expect(groups[0]!.label).toBe('Đường huyết');
    expect(groups[0]!.items.map((item) => item.series.testName)).toEqual(['HbA1c', 'Glucose']);
    expect(groups[1]!.items.map((item) => item.series.testName)).toEqual(['Creatinin', 'Ure']);
    expect(groups[1]!.items[0]!.note).toBe('Chất thải từ cơ bắp, do thận lọc ra');
    expect(groups[2]!.items[0]!.note).toBeNull();
  });

  it('TC-396 — không có chuỗi nào thì không có nhóm', () => {
    expect(groupLabSeries([])).toEqual([]);
  });
});
