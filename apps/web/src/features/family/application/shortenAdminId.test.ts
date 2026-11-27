import { expect, it } from 'vitest';
import { shortenAdminId } from './shortenAdminId';
it('TC-841: chỉ hiện tám ký tự đầu', () =>
  expect(shortenAdminId('12345678-1234-4234-8234-123456789abc')).toBe('12345678'));
