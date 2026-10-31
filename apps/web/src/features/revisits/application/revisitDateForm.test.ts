import { describe, expect, it } from 'vitest';
import { revisitDateFormSchema } from './revisitDateForm';
describe('TC-472 — kiểm ngày hẹn phía web', () => {
  it.each(['', '2026-10-01', '2036-09-28'])('chấp nhận biên %s', (revisitDate) => {
    expect(revisitDateFormSchema.safeParse({ issuedDate: '2026-10-01', revisitDate }).success).toBe(true);
  });
  it.each(['2026-09-30', '2036-09-29', '2026-02-30', 'abc'])('chặn ngày sai %s', (revisitDate) => {
    const result = revisitDateFormSchema.safeParse({ issuedDate: '2026-10-01', revisitDate });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['revisitDate']);
  });
});
