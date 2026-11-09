import { expect, it } from 'vitest';
import { resolvePainIssueForm } from './resolvePainIssueForm';
import { painIssueResolveDates } from './painIssueResolveDates';

it('TC-684: ngày Việt Nam qua nửa đêm và chấp nhận hai biên', () => {
  const now = new Date('2026-11-06T17:00:00Z');
  const last = '2026-11-05T17:30:00Z';
  expect(painIssueResolveDates(last, now)).toEqual({ min: '2026-11-06', max: '2026-11-07' });
  for (const resolvedOn of ['2026-11-06', '2026-11-07'])
    expect(resolvePainIssueForm(resolvedOn, last, now)).toEqual({ resolvedOn });
});
it('TC-684: từ chối ngày rỗng, không tồn tại, trước lần ghi cuối và tương lai', () => {
  const now = new Date('2026-11-06T17:00:00Z');
  for (const date of ['', '2026-02-30', '2026-11-05', '2026-11-08'])
    expect(() => resolvePainIssueForm(date, '2026-11-05T17:30:00Z', now)).toThrow();
});
