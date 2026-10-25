import { describe, expect, it } from 'vitest';
import { normalizeValue } from './normalizeValue.js';

describe('normalizeValue', () => {
  it('bỏ khoảng trắng thừa và không phân biệt hoa/thường', () => {
    expect(normalizeValue('  Bệnh viện   ĐA KHOA ')).toBe(normalizeValue('bệnh viện đa khoa'));
  });

  it('giữ dấu tiếng Việt khi so sánh', () => {
    expect(normalizeValue('viên')).not.toBe(normalizeValue('vien'));
  });

  it('đồng nhất dạng Unicode dựng sẵn và tổ hợp', () => {
    expect(normalizeValue('viến')).toBe(normalizeValue('viến'));
  });

  it('so mảng buổi dùng như tập hợp, không phụ thuộc thứ tự', () => {
    expect(normalizeValue(['evening', 'morning'])).toBe(normalizeValue(['morning', 'evening']));
  });

  it('phân biệt null với chuỗi rỗng', () => {
    expect(normalizeValue(null)).not.toBe(normalizeValue(''));
  });

  it('so số theo giá trị', () => {
    expect(normalizeValue(7.0)).toBe(normalizeValue(7));
  });
});
