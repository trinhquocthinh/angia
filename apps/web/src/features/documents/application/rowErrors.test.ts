import { describe, expect, it } from 'vitest';
import { PRESCRIPTION_ROW_FIELDS } from './prescriptionForm';
import { summarizeRowErrors } from './rowErrors';

describe('Tóm tắt dòng lỗi của form nhiều dòng (BR-025)', () => {
  it('chỉ liệt kê các dòng có lỗi, đánh số từ 1 kèm tên để tìm đúng dòng', () => {
    const errors = [
      undefined,
      { slots: { message: 'Chọn ít nhất một buổi dùng.' }, durationDays: { message: 'Nhập số ngày.' } },
      { name: { message: 'Nhập tên thuốc.' } },
    ];
    expect(summarizeRowErrors(errors, ['Amlodipin', ' Metformin ', ''], PRESCRIPTION_ROW_FIELDS)).toEqual([
      { index: 1, label: 'Dòng 2 · Metformin', messages: ['Chọn ít nhất một buổi dùng.', 'Nhập số ngày.'] },
      { index: 2, label: 'Dòng 3', messages: ['Nhập tên thuốc.'] },
    ]);
  });

  it('lời nhắn theo thứ tự trường được truyền vào', () => {
    const errors = [{ value: { message: 'Nhập kết quả.' }, testName: { message: 'Nhập tên chỉ số.' } }];
    expect(summarizeRowErrors(errors, [''], ['testName', 'value'])).toEqual([
      { index: 0, label: 'Dòng 1', messages: ['Nhập tên chỉ số.', 'Nhập kết quả.'] },
    ]);
  });

  it('không có lỗi dòng thì trả về danh sách rỗng', () => {
    expect(summarizeRowErrors(undefined, [], PRESCRIPTION_ROW_FIELDS)).toEqual([]);
  });
});
