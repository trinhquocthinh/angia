import { describe, expect, it } from 'vitest';
import {
  readingFormSchema,
  toApproveRequest,
  toReadingFormValues,
  type ReadingFormValues,
} from './readingForm';

const values = (patch: Partial<ReadingFormValues> = {}): ReadingFormValues => ({
  measuredAt: '2026-10-05',
  measuredTime: '07:10',
  kind: 'blood_pressure',
  systolic: '145',
  diastolic: '90',
  pulse: '',
  glucoseValue: '',
  glucoseUnit: '',
  ...patch,
});
const errorsOf = (input: ReadingFormValues) => {
  const result = readingFormSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('Form đối soát số đo máy (SPEC-010, SPEC-019)', () => {
  it('điền sẵn từ bản trích xuất; trường null thành ô trống, không suy diễn', () => {
    expect(
      toReadingFormValues({
        type: 'device_reading',
        measuredAt: null,
        measuredTime: null,
        kind: 'glucose',
        systolic: null,
        diastolic: null,
        pulse: null,
        glucoseValue: 7.2,
        glucoseUnit: null,
      }),
    ).toEqual(
      values({
        measuredAt: '',
        measuredTime: '',
        kind: 'glucose',
        systolic: '',
        diastolic: '',
        glucoseValue: '7.2',
      }),
    );
  });

  it('chưa có bản trích xuất → form trống, mặc định huyết áp', () => {
    expect(toReadingFormValues(null)).toEqual(
      values({ measuredAt: '', measuredTime: '', systolic: '', diastolic: '' }),
    );
  });

  it('SPEC-010: thiếu ngày đo báo ngay tại trường ngày', () => {
    expect(errorsOf(values({ measuredAt: '' }))).toEqual({ measuredAt: 'Nhập ngày đo ghi trên máy.' });
  });

  it('TC-055 phía client: 85/130 báo lỗi tại ô tâm thu', () => {
    expect(errorsOf(values({ systolic: '85', diastolic: '130' }))).toEqual({
      systolic: 'Tâm thu phải lớn hơn tâm trương.',
    });
  });

  it('BR-019: thiếu số huyết áp hoặc nhập chữ báo đúng ô', () => {
    expect(errorsOf(values({ systolic: '', diastolic: 'abc' }))).toEqual({
      systolic: 'Nhập số tâm thu.',
      diastolic: 'Nhập số nguyên dương.',
    });
  });

  it('TC-056 phía client: đường huyết thiếu đơn vị báo tại ô đơn vị', () => {
    expect(errorsOf(values({ kind: 'glucose', glucoseValue: '7,2' }))).toEqual({
      glucoseUnit: 'Chọn đơn vị mmol/L hoặc mg/dL.',
    });
  });

  it('chuyển thành lệnh duyệt: số thập phân dấu phẩy, ô trống thành null, chỉ giữ trường của loại chỉ số', () => {
    expect(
      toApproveRequest(
        values({ kind: 'glucose', glucoseValue: '7,2', glucoseUnit: 'mmol/L', systolic: '1' }),
        true,
      ),
    ).toEqual({
      type: 'device_reading',
      confirmOutOfRange: true,
      data: {
        type: 'device_reading',
        measuredAt: '2026-10-05',
        measuredTime: '07:10',
        kind: 'glucose',
        systolic: null,
        diastolic: null,
        pulse: null,
        glucoseValue: 7.2,
        glucoseUnit: 'mmol/L',
      },
    });
    expect(toApproveRequest(values({ measuredTime: '' }), false).data).toMatchObject({
      measuredTime: null,
      systolic: 145,
      diastolic: 90,
      pulse: null,
    });
  });
});
