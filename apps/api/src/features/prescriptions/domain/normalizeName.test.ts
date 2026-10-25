import { describe, expect, it } from 'vitest';
import { normalizeName } from './normalizeName.js';

describe('normalizeName — chuẩn hóa tên thuốc/chỉ số (SPEC-012)', () => {
  it('đưa về chữ thường và gộp khoảng trắng', () => {
    expect(normalizeName('  METFORMIN   500mg ')).toBe('metformin 500mg');
  });

  it('bỏ toàn bộ dấu tiếng Việt, kể cả chữ đ', () => {
    expect(normalizeName('Đường huyết lúc đói')).toBe('duong huyet luc doi');
    expect(normalizeName('Amlodipin')).toBe(normalizeName('amlodipin'));
  });
});
