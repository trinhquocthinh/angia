import { reopenPainIssueRequestSchema, type PainIssueSummary } from '@angia/contracts';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { transitionPainIssue } from '../domain/painIssueStatus.js';
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

export function reopenPainIssue(
  repository: PainIssueRepository,
  session: PainIssueSession & IssueTarget,
  body: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<PainIssueSummary>> {
  const at = now();
  return repository.withFamily(session.familyId, async (store) => {
    const loaded = await loadPainIssue(store, session, true);
    if (!loaded.ok) return loaded;
    const parsed = reopenPainIssueRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const { issue } = loaded.value;
    const existingTrackingIssueId =
      issue.status === 'resolved'
        ? await store.findTrackingIssue(
            session.profileId,
            { region: issue.region, side: issue.side },
            issue.id,
          )
        : null;
    const transition = transitionPainIssue(issue, { kind: 'reopen', existingTrackingIssueId });
    if (!transition.ok) return transition;
    const result = await store.changeStatus(session.profileId, session.issueId, {
      status: 'tracking',
      resolvedOn: null,
      kind: 'reopened',
      on: medicationToday(() => at),
      accountId: session.accountId,
      at,
    });
    return result.ok ? { ok: true, value: toPainIssueSummary(result.value) } : result;
  });
}
