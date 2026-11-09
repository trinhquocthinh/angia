import { bodyLocationSchema, updatePainIssueRequestSchema, type PainIssueSummary } from '@angia/contracts';
import type {
  IssueTarget,
  PainIssueClock,
  PainIssueOutcome,
  PainIssueRepository,
  PainIssueSession,
} from './ports.js';
import { loadPainIssue } from './loadPainIssue.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';
import { toPainIssueSummary } from './toPainIssueSummary.js';

export function updatePainIssue(
  repository: PainIssueRepository,
  session: PainIssueSession & IssueTarget,
  body: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<PainIssueSummary>> {
  const at = now();
  return repository.withFamily(session.familyId, async (store) => {
    const loaded = await loadPainIssue(store, session, true);
    if (!loaded.ok) return loaded;
    const parsed = updatePainIssueRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const { issue } = loaded.value;
    const location = bodyLocationSchema.safeParse({
      region: parsed.data.region ?? issue.region,
      side: parsed.data.side ?? issue.side,
    });
    if (!location.success) return painIssueValidationFailure(location.error);
    if (issue.status === 'tracking') {
      const existingIssueId = await store.findTrackingIssue(session.profileId, location.data, issue.id);
      if (existingIssueId !== null)
        return { ok: false, code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId } };
    }
    const result = await store.updateIssue(
      session.profileId,
      issue.id,
      { ...location.data, title: parsed.data.title ?? issue.title },
      { accountId: session.accountId, at },
    );
    return result.ok ? { ok: true, value: toPainIssueSummary(result.value) } : result;
  });
}
