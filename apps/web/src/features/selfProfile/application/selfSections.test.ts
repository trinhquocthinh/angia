import { describe, expect, it } from 'vitest';
import { parseSelfSection, resolveSelfSection, selfSections } from './selfSections';

describe('SPEC-042 — các mục "Hồ sơ của tôi"', () => {
  it('BR-049: ẩn "Diễn biến sức khỏe" khi hồ sơ không hiện số đo, giữ các mục khác', () => {
    expect(selfSections(true).map((item) => item.key)).toEqual([
      'today',
      'revisits',
      'timeline',
      'health',
      'lab-results',
      'temperatures',
    ]);
    expect(selfSections(false).map((item) => item.key)).toEqual([
      'today',
      'revisits',
      'timeline',
      'lab-results',
      'temperatures',
    ]);
  });
  it('sửa URL sang mục bị ẩn hoặc không có thì về trang đầu', () => {
    expect(resolveSelfSection('health', false)).toBe('today');
    expect(resolveSelfSection('health', true)).toBe('health');
    expect(resolveSelfSection(undefined, true)).toBe('today');
  });
  it('tham số URL lạ không được nhận làm mục', () => {
    expect(parseSelfSection('timeline')).toBe('timeline');
    expect(parseSelfSection('documents')).toBeUndefined();
    expect(parseSelfSection(1)).toBeUndefined();
  });
});
