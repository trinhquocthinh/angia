import { expect, it } from 'vitest';
import { formatHouseholdDateTime, formatRemainingDuration } from './formatHouseholdDateTime';

it('SPEC-069: định dạng ngày giờ dd/MM/yyyy HH:mm theo giờ địa phương', () => {
  const sample = new Date(2026, 10, 20, 14, 30).toISOString();
  expect(formatHouseholdDateTime(sample)).toBe('20/11/2026 14:30');
  const padded = new Date(2026, 0, 5, 8, 7).toISOString();
  expect(formatHouseholdDateTime(padded)).toBe('05/01/2026 08:07');
  expect(formatHouseholdDateTime('invalid')).toBe('');
});

it('SPEC-069: tính thời gian còn lại theo giờ và phút', () => {
  const now = new Date(2026, 10, 19, 15, 20);
  const later = new Date(2026, 10, 20, 14, 30).toISOString();
  expect(formatRemainingDuration(later, now)).toBe('23 giờ 10 phút');

  const soon = new Date(2026, 10, 19, 15, 20, 30).toISOString();
  expect(formatRemainingDuration(soon, now)).toBe('0 giờ 1 phút');

  const past = new Date(2026, 10, 19, 14, 0).toISOString();
  expect(formatRemainingDuration(past, now)).toBe('0 giờ 0 phút');
});
