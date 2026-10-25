import { describe, expect, it } from 'vitest';
import { fitWithin } from './fitWithin';

describe('Thu kích thước ảnh theo cạnh dài tối đa', () => {
  it('ảnh ngang 4032×3024 thu về cạnh dài 3000, giữ tỉ lệ', () => {
    expect(fitWithin({ width: 4032, height: 3024 }, 3000)).toEqual({ width: 3000, height: 2250 });
  });
  it('ảnh dọc thu theo chiều cao', () => {
    expect(fitWithin({ width: 3024, height: 4032 }, 3000)).toEqual({ width: 2250, height: 3000 });
  });
  it('ảnh đã nhỏ hơn ngưỡng giữ nguyên, không phóng to', () => {
    expect(fitWithin({ width: 1200, height: 900 }, 3000)).toEqual({ width: 1200, height: 900 });
  });
  it('làm tròn và không bao giờ trả cạnh 0', () => {
    expect(fitWithin({ width: 9000, height: 1 }, 3000)).toEqual({ width: 3000, height: 1 });
  });
});
