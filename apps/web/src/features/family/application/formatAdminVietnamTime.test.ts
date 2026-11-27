import { expect, it } from 'vitest';
import { formatAdminVietnamTime } from './formatAdminVietnamTime';
it('TC-841: giờ Việt Nam qua nửa đêm, bỏ phần microsecond', () =>
  expect(formatAdminVietnamTime('2026-11-26T18:04:59.123456Z')).toBe('27/11/2026 01:04'));
it('TC-841: định dạng mốc tuần không đổi ngày', () =>
  expect(formatAdminVietnamTime('2026-11-23')).toBe('23/11/2026'));
