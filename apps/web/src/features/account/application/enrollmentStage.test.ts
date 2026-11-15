import { expect, it } from 'vitest';
import { enrollmentStage } from './enrollmentStage';
it('TC-751: marker quay về chỉ hợp lệ trong mười phút', () => {
  expect(enrollmentStage('1000', 601000)).toBe('returning');
  expect(enrollmentStage('1000', 601001)).toBe('unverified');
});
it('TC-901: xác minh hết hạn đúng 300000 ms', () => {
  const marker = JSON.stringify({ verifiedAt: 1000 });
  expect(enrollmentStage(marker, 300999)).toBe('verified');
  expect(enrollmentStage(marker, 301000)).toBe('unverified');
});
it.each([null, '', 'garbage', 'null', '{}', '-1', '2000'])(
  'TC-901: bỏ marker lỗi hoặc ở tương lai %s',
  (marker) => {
    expect(enrollmentStage(marker, 1000)).toBe('unverified');
  },
);
