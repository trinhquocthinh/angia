import { describe, expect, it } from 'vitest';
import { adherenceFormSchema, medicationSuggestions, suggestStatus } from './adherenceForm';
import { groupByMedication } from './medicationPeriods';
import type { AdherencePeriod } from './ports';

const stopped: AdherencePeriod = {
  id: 'a',
  healthProfileId: 'p',
  medicationName: 'Amlodipin',
  status: 'stopped',
  fromDate: '2026-09-15',
  toDate: null,
};
const groups = groupByMedication([stopped]);

describe('TC-264 form ghi nhận giai đoạn (SPEC-022)', () => {
  const schema = adherenceFormSchema('2026-10-13');
  it('tên bắt buộc ≤ 200 ký tự, cắt khoảng trắng; ngày không sau hôm nay', () => {
    expect(schema.parse({ medicationName: ' Amlodipin ', status: 'taking', fromDate: '2026-10-13' })).toEqual(
      {
        medicationName: 'Amlodipin',
        status: 'taking',
        fromDate: '2026-10-13',
      },
    );
    const errors = (values: object) =>
      schema.safeParse(values).error?.issues.map((issue) => issue.message) ?? [];
    expect(errors({ medicationName: ' ', status: 'taking', fromDate: '2026-10-13' })).toEqual([
      'Nhập tên thuốc.',
    ]);
    expect(errors({ medicationName: 'x'.repeat(201), status: 'taking', fromDate: '2026-10-13' })).toEqual([
      'Tên thuốc tối đa 200 ký tự.',
    ]);
    expect(errors({ medicationName: 'A', status: 'taking', fromDate: '2026-10-14' })).toEqual([
      'Ngày bắt đầu không được sau hôm nay.',
    ]);
    expect(errors({ medicationName: 'A', status: 'taking', fromDate: '' })).toEqual(['Chọn ngày bắt đầu.']);
  });

  it('trạng thái gợi ý ngược với giai đoạn mới nhất của cùng thuốc; thuốc mới → đang dùng', () => {
    expect(suggestStatus(' AMLODIPIN', groups)).toBe('taking');
    expect(suggestStatus('Metformin', groups)).toBe('taking');
    expect(suggestStatus('Amlodipin', groupByMedication([{ ...stopped, status: 'taking' }]))).toBe('stopped');
  });

  it('gợi ý tên: thuốc đã có giai đoạn + thuốc đang dùng, bỏ trùng theo tên chuẩn hóa', () => {
    expect(medicationSuggestions(groups, ['Metformin', 'amlodipin', 'Canxi'])).toEqual([
      'Amlodipin',
      'Canxi',
      'Metformin',
    ]);
  });
});
