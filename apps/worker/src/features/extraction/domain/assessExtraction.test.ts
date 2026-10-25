import { describe, expect, it } from 'vitest';
import { assessExtraction } from './assessExtraction.js';
import type { ExtractedContent } from './ExtractionDocument.js';

const prescription: ExtractedContent = { type: 'prescription', items: [{ name: 'Amlodipin' }] };
const reading = (values: Partial<Record<'systolic' | 'diastolic' | 'pulse' | 'glucoseValue', number>>) =>
  ({
    type: 'device_reading',
    systolic: null,
    diastolic: null,
    pulse: null,
    glucoseValue: null,
    ...values,
  }) satisfies ExtractedContent;

describe('Đánh giá payload trích xuất trước khi lưu (SPEC-009, BR-016)', () => {
  it('đơn thuốc có dòng thuốc, không khai loại → dùng được', () => {
    expect(assessExtraction(null, prescription)).toEqual({ usable: true });
  });

  it('loại AI nhận ra trùng loại người dùng khai → dùng được', () => {
    expect(assessExtraction('prescription', prescription)).toEqual({ usable: true });
  });

  it('TC-029: đơn thuốc viết tay AI trả về danh sách rỗng → empty', () => {
    expect(assessExtraction(null, { type: 'prescription', items: [] })).toEqual({
      usable: false,
      reason: 'empty',
    });
    expect(assessExtraction(null, { type: 'lab_result', items: [] })).toEqual({
      usable: false,
      reason: 'empty',
    });
  });

  it('màn hình máy đo không đọc được chỉ số nào → empty; có một chỉ số → dùng được', () => {
    expect(assessExtraction(null, reading({}))).toEqual({ usable: false, reason: 'empty' });
    expect(assessExtraction(null, reading({ glucoseValue: 6.4 }))).toEqual({ usable: true });
  });

  it('người dùng khai đơn thuốc nhưng AI nhận ra phiếu xét nghiệm → type_mismatch, không đoán', () => {
    expect(assessExtraction('prescription', { type: 'lab_result', items: [{ testName: 'HbA1c' }] })).toEqual({
      usable: false,
      reason: 'type_mismatch',
    });
  });
});
