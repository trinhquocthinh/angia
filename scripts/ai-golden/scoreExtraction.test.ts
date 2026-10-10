import { describe, expect, it } from 'vitest';
import type { ExtractionPayload } from '@angia/contracts';
import { scoreExtraction } from './scoreExtraction.js';

const item = {
  name: 'Amlodipin',
  strength: null,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning' as const],
  durationDays: 30,
  longTerm: false,
  note: null,
  totalQuantity: null,
};

const expected: ExtractionPayload = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: 'Bệnh viện Đa khoa Tỉnh',
  diagnosis: null,
  items: [item],
};

// 3 trường đầu (type, issuedDate, facility) + 7 trường chấm điểm mỗi dòng thuốc (không chấm `note`).
const FIELDS_PER_ONE_ITEM = 10;

describe('scoreExtraction', () => {
  it('chấm đủ điểm khi khớp sau chuẩn hóa', () => {
    const actual = { ...expected, facility: 'BỆNH VIỆN  ĐA KHOA TỈNH' };
    expect(scoreExtraction(expected, actual)).toEqual({
      correct: 10,
      total: FIELDS_PER_ONE_ITEM,
      mismatches: [],
    });
  });

  it('ghi nhận đường dẫn trường sai', () => {
    const actual = { ...expected, items: [{ ...item, durationDays: 3 }] };
    const score = scoreExtraction(expected, actual);
    expect(score.correct).toBe(9);
    expect(score.mismatches).toEqual(['items[0].durationDays']);
  });

  it('tính null đúng là trường đúng, null sai là trường sai', () => {
    const actual = { ...expected, items: [{ ...item, strength: '5mg' }] };
    expect(scoreExtraction(expected, actual).mismatches).toEqual(['items[0].strength']);
  });

  it('không chấm trường note vì là câu cách dùng nguyên văn (quyết định E1-S1-T1)', () => {
    const actual = { ...expected, items: [{ ...item, note: 'Uống sau ăn' }] };
    expect(scoreExtraction(expected, actual)).toEqual({
      correct: 10,
      total: FIELDS_PER_ONE_ITEM,
      mismatches: [],
    });
  });

  it('chưa chấm chẩn đoán vì đáp án golden chưa gán nhãn (E3-S3-T1)', () => {
    const actual = { ...expected, diagnosis: 'Tăng huyết áp' };
    expect(scoreExtraction(expected, actual)).toMatchObject({ correct: 10, total: FIELDS_PER_ONE_ITEM });
  });

  it('chưa chấm tổng số lượng vì đáp án golden chưa gán nhãn (E3-S3-T3)', () => {
    const actual: ExtractionPayload = { ...expected, items: [{ ...item, totalQuantity: 30 }] };
    expect(scoreExtraction(expected, actual)).toMatchObject({ correct: 10, total: FIELDS_PER_ONE_ITEM });
  });

  it('tính mọi trường của dòng bị bỏ sót là sai', () => {
    const actual = { ...expected, items: [] };
    expect(scoreExtraction(expected, actual)).toMatchObject({ correct: 3, total: FIELDS_PER_ONE_ITEM });
  });

  it('cộng trường của dòng thừa (bịa thêm) vào mẫu số', () => {
    const actual = { ...expected, items: [item, { ...item, name: 'Paracetamol' }] };
    expect(scoreExtraction(expected, actual)).toMatchObject({ correct: 10, total: 17 });
  });

  it('chấm 0 điểm khi model trả lỗi hoặc sai schema', () => {
    expect(scoreExtraction(expected, null)).toEqual({
      correct: 0,
      total: FIELDS_PER_ONE_ITEM,
      mismatches: ['*'],
    });
  });
});
