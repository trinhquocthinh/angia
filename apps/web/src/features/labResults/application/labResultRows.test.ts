import { describe, expect, it } from 'vitest';
import type { LabResult } from '@angia/contracts';
import { labResultRows } from './labResultRows';

const base: LabResult = {
  id: 'a',
  healthProfileId: 'p',
  sourceDocumentId: 'doc',
  resultDate: '2026-01-05',
  testName: 'HbA1c',
  value: '7.1',
  unit: '%',
  referenceRange: '4.0 - 6.0',
  facility: 'BV Nhân dân Gia Định',
  manualWithoutSource: false,
  createdAt: '2026-01-05T08:00:00.000Z',
};

describe('labResultRows — Design §6 "Kết quả cận lâm sàng"', () => {
  it('TC-259 — lần mới nhất trước; giá trị, đơn vị, khoảng tham chiếu nguyên văn phiếu', () => {
    const rows = labResultRows([base, { ...base, id: 'b', resultDate: '2026-06-12', value: '6,8' }]);
    expect(rows.map((row) => row.id)).toEqual(['b', 'a']);
    expect(rows[0]).toEqual({
      id: 'b',
      date: '12/06/2026',
      value: '6,8',
      unit: '%',
      referenceRange: 'Khoảng tham chiếu trên phiếu: 4.0 - 6.0',
      source: 'BV Nhân dân Gia Định',
    });
  });

  it('TC-259 — phiếu không in khoảng tham chiếu, không đơn vị, nhập tay không nơi xét nghiệm', () => {
    const [row] = labResultRows([
      {
        ...base,
        unit: null,
        referenceRange: null,
        facility: null,
        sourceDocumentId: null,
        manualWithoutSource: true,
      },
    ]);
    expect(row).toMatchObject({
      unit: null,
      referenceRange: 'Phiếu không in khoảng tham chiếu',
      source: 'Nhập tay',
    });
    expect(labResultRows([{ ...base, facility: null }])[0]!.source).toBe('Từ phiếu xét nghiệm');
  });
});
