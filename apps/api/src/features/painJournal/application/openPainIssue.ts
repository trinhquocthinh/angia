import { createPainIssueRequestSchema, type PainIssueDetail } from '@angia/contracts';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { preparePainEntry } from '../domain/painEntry.js';
import type { PainIssueClock, PainIssueOutcome, PainIssueRepository, PainIssueSession } from './ports.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';
import { toPainIssueDetail } from './toPainIssueDetail.js';

export function openPainIssue(
  repository: PainIssueRepository,
  session: PainIssueSession,
  body: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<PainIssueDetail>> {
  const at = now();
  return repository.withFamily(session.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(session.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const parsed = createPainIssueRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const { region, side, title = null, firstEntry } = parsed.data;
    const entry = preparePainEntry(
      { status: 'tracking', resolvedOn: null },
      {
        kind: 'create',
        value: {
          level: firstEntry.level,
          recordedAt: firstEntry.recordedAt ?? at.toISOString(),
          note: firstEntry.note ?? null,
        },
      },
      at,
    );
    if (!entry.ok) return entry;
    const existingIssueId = await store.findTrackingIssue(session.profileId, { region, side });
    if (existingIssueId !== null)
      return { ok: false, code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId } };
    const result = await store.insertIssue({
      profileId: session.profileId,
      region,
      side,
      title,
      firstEntry: entry.value,
      accountId: session.accountId,
      at,
    });
    return result.ok ? { ok: true, value: toPainIssueDetail(result.value) } : result;
  });
}
