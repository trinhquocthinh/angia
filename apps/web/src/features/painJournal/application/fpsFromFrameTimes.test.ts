import { describe, expect, it } from 'vitest';
import { fpsFromFrameTimes } from './fpsFromFrameTimes';

describe('fpsFromFrameTimes', () => {
  it('tính FPS trung bình và khung chậm nhất từ dấu thời gian khung hình', () => {
    expect(fpsFromFrameTimes([0, 20, 40, 100])).toEqual({ fps: 30, worstMs: 60 });
  });

  it('dưới 2 khung hình thì chưa đo được', () => {
    expect(fpsFromFrameTimes([])).toBeNull();
    expect(fpsFromFrameTimes([16])).toBeNull();
  });
});
