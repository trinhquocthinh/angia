import { describe, expect, it } from 'vitest';
import { groupByMedication, pickDefaultMedication } from './medicationPeriods';
import { periodBands } from './periodBands';
import { periodText } from './periodText';
import type { AdherencePeriod } from './ports';

const period = (
  medicationName: string,
  status: AdherencePeriod['status'],
  fromDate: string,
  toDate: string | null,
): AdherencePeriod => ({
  id: `${medicationName}-${fromDate}`,
  healthProfileId: 'p',
  medicationName,
  status,
  fromDate,
  toDate,
});
const amlodipin = [
  period('Amlodipin', 'taking', '2026-08-01', '2026-09-14'),
  period('amlodipin ', 'stopped', '2026-09-15', null),
];
const metformin = [period('Metformin', 'taking', '2026-09-20', null)];

describe('TC-263 giai đoạn theo thuốc cho biểu đồ (SPEC-023, BR-033)', () => {
  it('gom theo tên chuẩn hóa, tên hiển thị là lần ghi mới nhất, sắp theo tên', () => {
    const groups = groupByMedication([...metformin, ...amlodipin]);
    expect(groups.map((group) => [group.key, group.name, group.periods.length])).toEqual([
      ['amlodipin', 'amlodipin', 2],
      ['metformin', 'Metformin', 1],
    ]);
  });

  it('mặc định chọn thuốc có mốc bắt đầu mới nhất; không có giai đoạn → null', () => {
    expect(pickDefaultMedication(groupByMedication([...amlodipin, ...metformin]))).toBe('metformin');
    expect(pickDefaultMedication([])).toBeNull();
  });

  it('dải nền cắt theo khoảng xem; giai đoạn đang mở kéo tới hết khoảng', () => {
    expect(periodBands(amlodipin, { from: '2026-09-01', to: '2026-10-11' })).toEqual([
      { status: 'taking', from: '2026-09-01', to: '2026-09-14' },
      { status: 'stopped', from: '2026-09-15', to: '2026-10-11' },
    ]);
    expect(periodBands(amlodipin, { from: '2026-09-20', to: '2026-10-11' })).toEqual([
      { status: 'stopped', from: '2026-09-20', to: '2026-10-11' },
    ]);
  });

  it('mô tả giai đoạn chỉ gồm trạng thái và ngày, không nhận xét', () => {
    expect(amlodipin.map(periodText)).toEqual([
      'Đang dùng 01/08/2026 – 14/09/2026',
      'Ngưng từ 15/09/2026 đến nay',
    ]);
  });
});
