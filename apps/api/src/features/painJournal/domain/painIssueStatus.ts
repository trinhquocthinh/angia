import type { PainIssue } from './painIssue.js';

type PainIssueCommand =
  | {
      readonly kind: 'resolve';
      readonly resolvedOn: string;
      readonly today: string;
      readonly lastEntryOn: string;
    }
  | {
      readonly kind: 'reopen';
      readonly existingTrackingIssueId: string | null;
    };

type TransitionResult =
  | { ok: true; value: PainIssue }
  | { ok: false; code: 'ERR_VALIDATION' | 'ERR_INVALID_STATE_TRANSITION' }
  | {
      ok: false;
      code: 'ERR_PAIN_ISSUE_EXISTS';
      details: { existingIssueId: string };
    };

// Application cấp today/lastEntryOn dạng YYYY-MM-DD theo giờ Việt Nam;
// existingTrackingIssueId thuộc cùng hồ sơ/vùng/bên, loại chính vấn đề này.
export function transitionPainIssue(issue: PainIssue, command: PainIssueCommand): TransitionResult {
  if (command.kind === 'reopen') {
    if (issue.status !== 'resolved') {
      return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    }
    if (command.existingTrackingIssueId !== null) {
      return {
        ok: false,
        code: 'ERR_PAIN_ISSUE_EXISTS',
        details: { existingIssueId: command.existingTrackingIssueId },
      };
    }
    return {
      ok: true,
      value: { ...issue, status: 'tracking', resolvedOn: null },
    };
  }

  if (issue.status !== 'tracking') {
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  }

  const { resolvedOn, today, lastEntryOn } = command;
  const date = new Date(`${resolvedOn}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(resolvedOn) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== resolvedOn ||
    resolvedOn < lastEntryOn ||
    resolvedOn > today
  ) {
    return { ok: false, code: 'ERR_VALIDATION' };
  }

  return {
    ok: true,
    value: { ...issue, status: 'resolved', resolvedOn },
  };
}
