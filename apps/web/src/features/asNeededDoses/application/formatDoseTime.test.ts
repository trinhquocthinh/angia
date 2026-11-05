import { expect, it } from 'vitest';
import { formatDoseTime } from './formatDoseTime';
it('TC-495: luôn hiển thị cả ngày và giờ Việt Nam khi qua ngày UTC', () => {
  expect(formatDoseTime('2026-11-03T17:30:00Z')).toBe('00:30 · 04/11/2026');
});
