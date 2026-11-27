import { expect, it } from 'vitest';
import { isAdminUuid } from './isAdminUuid';
it.each(['12345678-1234-4234-8234-123456789abc', 'ABCDEF12-1234-7234-9234-123456789ABC'])(
  'TC-841: nhận UUID %s',
  (value) => expect(isAdminUuid(value)).toBe(true),
);
it.each(['', 'abc', '12345678-1234-4234-0234-123456789abc', '12345678-1234-0234-8234-123456789abc'])(
  'TC-841: từ chối mã sai %s',
  (value) => expect(isAdminUuid(value)).toBe(false),
);
it.each(['00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff'])(
  'TC-841: nhận UUID đặc biệt mà API cho phép %s',
  (value) => expect(isAdminUuid(value)).toBe(true),
);
