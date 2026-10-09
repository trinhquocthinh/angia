import { describe, expect, it } from 'vitest';
import { summarizeRowErrors } from './prescriptionRowErrors';

describe('Tóm tắt dòng thuốc lỗi (BR-025)', () => {
  it('chỉ liệt kê các dòng có lỗi, đánh số từ 1 kèm tên thuốc để tìm đúng dòng', () => {
    const errors = [
      undefined,
      { slots: { message: 'Chọn ít nhất một buổi dùng.' }, durationDays: { message: 'Nhập số ngày.' } },
      { name: { message: 'Nhập tên thuốc.' } },
    ];
    expect(summarizeRowErrors(errors, ['Amlodipin', ' Metformin ', ''])).toEqual([
      { index: 1, label: 'Dòng 2 · Metformin', messages: ['Chọn ít nhất một buổi dùng.', 'Nhập số ngày.'] },
      { index: 2, label: 'Dòng 3', messages: ['Nhập tên thuốc.'] },
    ]);
  });

  it('không có lỗi dòng thì trả về danh sách rỗng', () => {
    expect(summarizeRowErrors(undefined, [])).toEqual([]);
  });
});
