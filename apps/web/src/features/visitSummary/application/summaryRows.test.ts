import { describe, expect, it } from 'vitest';
import type { AdherencePeriod, CurrentMedicationCourse, LabResult } from '@angia/contracts';
import { adherenceRows } from './adherenceRows';
import { labRows } from './labRows';
import { medicationRows } from './medicationRows';

const course: CurrentMedicationCourse = {
  id: 'c1',
  healthProfileId: 'p',
  prescriptionItemId: 'i1',
  source: 'prescription',
  name: 'Metformin',
  strength: '500mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['evening', 'morning'],
  startDate: '2026-10-01',
  endDate: '2026-10-22',
  status: 'active',
  prescriptionIssuedDate: '2026-10-01',
};

describe('medicationRows — bảng "Thuốc đang dùng" (Design v0.1 §7)', () => {
  it('TC-093 — tên + hàm lượng, liều · buổi theo thứ tự trong ngày, thời hạn, nguồn; tên A→Z', () => {
    const rows = medicationRows(
      [
        course,
        {
          ...course,
          id: 'c2',
          source: 'self_reported',
          prescriptionItemId: null,
          name: 'Canxi',
          strength: null,
          slots: ['morning'],
          endDate: null,
          prescriptionIssuedDate: null,
        },
      ],
      '2026-10-05',
    );
    expect(rows).toEqual([
      { id: 'c2', name: 'Canxi', dose: '1 viên · sáng', duration: 'Dài hạn', source: 'Tự khai' },
      {
        id: 'c1',
        name: 'Metformin 500mg',
        dose: '1 viên · sáng, tối',
        duration: 'Còn 18 ngày',
        source: 'Đơn 01/10/2026',
      },
    ]);
  });

  it('dòng thuốc không ghi liều (BR-025) và dùng khi cần', () => {
    const [row] = medicationRows([{ ...course, quantityPerDose: null, slots: ['as_needed'] }], '2026-10-05');
    expect(row!.dose).toBe('Theo đơn · khi cần');
  });
});

const lab: LabResult = {
  id: 'l1',
  healthProfileId: 'p',
  sourceDocumentId: 'doc',
  resultDate: '2026-10-01',
  testName: 'HbA1c',
  value: '7,1',
  unit: '%',
  referenceRange: '4,0 – 6,0',
  facility: 'BV Nhân dân Gia Định',
  manualWithoutSource: false,
  createdAt: '2026-10-01T08:00:00.000Z',
};

describe('labRows — "Xét nghiệm gần nhất", nguyên văn phiếu (BR-022, BR-033)', () => {
  it('TC-065 — giữ thứ tự API, giá trị + đơn vị, khoảng tham chiếu trên phiếu hoặc gạch ngang', () => {
    expect(
      labRows([lab, { ...lab, id: 'l2', testName: 'Creatinin', unit: null, referenceRange: null }]),
    ).toEqual([
      { id: 'l1', testName: 'HbA1c', date: '01/10/2026', result: '7,1 %', referenceRange: '4,0 – 6,0' },
      { id: 'l2', testName: 'Creatinin', date: '01/10/2026', result: '7,1', referenceRange: '—' },
    ]);
  });
});

const period: AdherencePeriod = {
  id: 'a1',
  healthProfileId: 'p',
  medicationName: 'Canxi',
  status: 'taking',
  fromDate: '2026-07-01',
  toDate: '2026-08-01',
};

describe('adherenceRows — "Giai đoạn dùng thuốc" (SPEC-023)', () => {
  it('nhóm theo thuốc, mốc tăng dần, chỉ trạng thái + ngày, không nhận xét (BR-033)', () => {
    const rows = adherenceRows([
      { ...period, id: 'a2', status: 'stopped', fromDate: '2026-08-02', toDate: '2026-08-16' },
      period,
      { ...period, id: 'a3', medicationName: 'Amlodipin 5mg', fromDate: '2026-09-01', toDate: null },
    ]);
    expect(rows).toEqual([
      {
        key: 'amlodipin 5mg',
        name: 'Amlodipin 5mg',
        periods: [{ id: 'a3', status: 'taking', text: 'Đang dùng từ 01/09/2026 đến nay' }],
      },
      {
        key: 'canxi',
        name: 'Canxi',
        periods: [
          { id: 'a1', status: 'taking', text: 'Đang dùng 01/07/2026 – 01/08/2026' },
          { id: 'a2', status: 'stopped', text: 'Ngưng 02/08/2026 – 16/08/2026' },
        ],
      },
    ]);
  });
});
