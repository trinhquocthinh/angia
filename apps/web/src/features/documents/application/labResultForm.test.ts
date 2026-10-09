import { describe, expect, it } from 'vitest';
import {
  emptyLabResultItem,
  labResultFormSchema,
  toLabResultApproval,
  toLabResultFormValues,
  type LabResultFormValues,
  type LabResultItemValues,
} from './labResultForm';

const item = (patch: Partial<LabResultItemValues> = {}): LabResultItemValues => ({
  testName: 'HbA1c',
  value: '7.2',
  unit: '%',
  referenceRange: '4.0 - 6.0',
  ...patch,
});
const values = (patch: Partial<LabResultFormValues> = {}): LabResultFormValues => ({
  resultDate: '2026-10-01',
  facility: 'Trung tâm Y tế Thành phố',
  items: [item()],
  ...patch,
});
const errorsOf = (input: LabResultFormValues) => {
  const result = labResultFormSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('Form đối soát kết quả xét nghiệm (SPEC-010, BR-022)', () => {
  it('điền sẵn từ bản trích xuất; trường null thành ô trống, không tự gán khoảng tham chiếu', () => {
    expect(
      toLabResultFormValues({
        type: 'lab_result',
        resultDate: null,
        facility: null,
        items: [
          { testName: 'Glucose', value: '<0.5', unit: null, referenceRange: null },
          { testName: 'Ure', value: null, unit: 'mmol/L', referenceRange: '2.5 - 7.5' },
        ],
      }),
    ).toEqual({
      resultDate: '',
      facility: '',
      items: [
        { testName: 'Glucose', value: '<0.5', unit: '', referenceRange: '' },
        { testName: 'Ure', value: '', unit: 'mmol/L', referenceRange: '2.5 - 7.5' },
      ],
    });
  });

  it('chưa có bản trích xuất hoặc không có dòng thì mở một dòng trống để nhập theo ảnh', () => {
    expect(toLabResultFormValues(null).items).toEqual([emptyLabResultItem()]);
    const empty = toLabResultFormValues({ type: 'lab_result', resultDate: null, facility: null, items: [] });
    expect(empty.items).toEqual([emptyLabResultItem()]);
  });

  it('bản đối soát đầy đủ thì hợp lệ', () => {
    expect(errorsOf(values())).toEqual({});
  });

  it('TC-031 (biến thể xét nghiệm): thiếu ngày kết quả thì báo ngay dưới ô ngày', () => {
    expect(errorsOf(values({ resultDate: '' }))).toEqual({
      resultDate: 'Nhập ngày trả kết quả ghi trên phiếu.',
    });
  });

  it('dòng thiếu tên chỉ số hoặc kết quả báo đúng vị trí dòng', () => {
    const input = values({ items: [item(), item({ testName: '  ', value: '' })] });
    expect(errorsOf(input)).toEqual({
      'items.1.testName': 'Nhập tên chỉ số ghi trên phiếu.',
      'items.1.value': 'Nhập kết quả ghi trên phiếu.',
    });
  });

  it('BR-022 / BR-033: kết quả là chữ tự do, không so với khoảng tham chiếu', () => {
    const input = values({
      items: [item({ value: 'Âm tính', referenceRange: 'Âm tính' }), item({ value: '9.8' })],
    });
    expect(errorsOf(input)).toEqual({});
  });

  it('BR-022: gửi nguyên văn đã bỏ khoảng trắng đầu cuối; ô trống thành null', () => {
    const input = values({
      facility: '  ',
      items: [item({ testName: ' HbA1c ', value: ' 7,2 ', unit: '', referenceRange: ' 4.0 - 6.0 ' })],
    });
    expect(toLabResultApproval(input)).toEqual({
      type: 'lab_result',
      resultDate: '2026-10-01',
      facility: null,
      items: [{ testName: 'HbA1c', value: '7,2', unit: null, referenceRange: '4.0 - 6.0' }],
    });
  });
});
