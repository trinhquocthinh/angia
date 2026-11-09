import type { PainIssue } from './painIssue.js';

export type PainEntry = {
  readonly level: number;
  readonly recordedAt: string;
  readonly note: string | null;
};

type EntryCommand =
  | { readonly kind: 'create'; readonly value: { level: number; recordedAt?: string; note?: string | null } }
  | { readonly kind: 'update'; readonly value: PainEntry };

type EntryResult =
  { ok: true; value: PainEntry } | { ok: false; code: 'ERR_VALIDATION' | 'ERR_INVALID_STATE_TRANSITION' };

// Contracts kiểm định dạng/độ dài; application ghép PATCH và cấp thời điểm server nhận.
export function preparePainEntry(
  issue: Pick<PainIssue, 'status' | 'resolvedOn'>,
  command: EntryCommand,
  receivedAt: Date,
): EntryResult {
  if (command.kind === 'create' && issue.status !== 'tracking') {
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  }
  const now = receivedAt.getTime();
  if (!Number.isFinite(now)) return { ok: false, code: 'ERR_VALIDATION' };
  const { level, note = null } = command.value;
  const recordedAt = command.value.recordedAt ?? receivedAt.toISOString();
  const timestamp = Date.parse(recordedAt);
  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 10 ||
    !Number.isFinite(timestamp) ||
    timestamp > now ||
    (issue.status === 'resolved' &&
      timestamp >= Date.parse(`${issue.resolvedOn}T00:00:00+07:00`) + 86_400_000)
  ) {
    return { ok: false, code: 'ERR_VALIDATION' };
  }
  return { ok: true, value: { level, recordedAt, note } };
}
