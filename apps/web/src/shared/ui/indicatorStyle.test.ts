import { describe, expect, it } from 'vitest';
import { indicatorStyle } from './indicatorStyle';

describe('indicatorStyle', () => {
  it('chưa đo được nút đang chọn thì ẩn nền chọn', () => {
    expect(indicatorStyle(null, false)).toEqual({ opacity: 0 });
  });

  it('đặt nền chọn đúng vị trí và bề rộng nút đang chọn', () => {
    expect(indicatorStyle({ offsetLeft: 92, offsetWidth: 80 }, true)).toEqual({
      opacity: 1,
      width: 80,
      transform: 'translateX(92px)',
    });
  });

  it('lần đo đầu không trượt để nền chọn không bay từ mép trái vào', () => {
    expect(indicatorStyle({ offsetLeft: 92, offsetWidth: 80 }, false)).toMatchObject({ transition: 'none' });
  });
});
