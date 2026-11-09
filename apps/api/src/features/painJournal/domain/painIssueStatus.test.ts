import { describe, expect, it } from 'vitest';
import type { PainIssue } from './painIssue.js';
import { transitionPainIssue } from './painIssueStatus.js';

const tracking: PainIssue = {
  id: 'issue-1',
  healthProfileId: 'profile-1',
  region: 'knee',
  side: 'left',
  title: null,
  status: 'tracking',
  resolvedOn: null,
};

const resolved: PainIssue = {
  ...tracking,
  status: 'resolved',
  resolvedOn: '2026-11-20',
};

describe('Vòng đời vấn đề đau — BR-058, BR-060', () => {
  it.each(['2026-11-18', '2026-11-21'])('TC-684: chấp nhận ngày khỏi tại hai biên %s', (resolvedOn) => {
    expect(
      transitionPainIssue(tracking, {
        kind: 'resolve',
        resolvedOn,
        today: '2026-11-21',
        lastEntryOn: '2026-11-18',
      }),
    ).toEqual({
      ok: true,
      value: { ...tracking, status: 'resolved', resolvedOn },
    });
  });

  it.each(['2026-11-17', '2026-11-22', '2026-02-30', '2026-13-01', '18/11/2026', '2026-11-18T00:00:00Z', ''])(
    'TC-684: từ chối ngày khỏi sai hoặc ngoài khoảng %s',
    (resolvedOn) => {
      expect(
        transitionPainIssue(tracking, {
          kind: 'resolve',
          resolvedOn,
          today: '2026-11-21',
          lastEntryOn: '2026-11-18',
        }),
      ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    },
  );

  it('TC-686: không đóng lại vấn đề đã khỏi', () => {
    expect(
      transitionPainIssue(resolved, {
        kind: 'resolve',
        resolvedOn: '2026-11-21',
        today: '2026-11-21',
        lastEntryOn: '2026-11-18',
      }),
    ).toEqual({ ok: false, code: 'ERR_INVALID_STATE_TRANSITION' });
  });

  it('TC-686: không mở lại vấn đề đang theo dõi', () => {
    expect(
      transitionPainIssue(tracking, {
        kind: 'reopen',
        existingTrackingIssueId: null,
      }),
    ).toEqual({ ok: false, code: 'ERR_INVALID_STATE_TRANSITION' });
  });

  it('TC-685: từ chối mở lại khi cùng vị trí có vấn đề đang theo dõi khác', () => {
    expect(
      transitionPainIssue(resolved, {
        kind: 'reopen',
        existingTrackingIssueId: 'issue-2',
      }),
    ).toEqual({
      ok: false,
      code: 'ERR_PAIN_ISSUE_EXISTS',
      details: { existingIssueId: 'issue-2' },
    });
  });

  it('TC-688: mở lại xóa ngày khỏi và không sửa đầu vào', () => {
    const before = structuredClone(resolved);

    expect(
      transitionPainIssue(resolved, {
        kind: 'reopen',
        existingTrackingIssueId: null,
      }),
    ).toEqual({
      ok: true,
      value: { ...resolved, status: 'tracking', resolvedOn: null },
    });
    expect(resolved).toEqual(before);
  });

  it('TC-684: đóng không sửa đầu vào', () => {
    const before = structuredClone(tracking);

    transitionPainIssue(tracking, {
      kind: 'resolve',
      resolvedOn: '2026-11-20',
      today: '2026-11-21',
      lastEntryOn: '2026-11-18',
    });

    expect(tracking).toEqual(before);
  });
});
