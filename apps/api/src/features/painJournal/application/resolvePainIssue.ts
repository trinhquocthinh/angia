import { resolvePainIssueRequestSchema, type PainIssueSummary } from '@angia/contracts';
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

export function resolvePainIssue(
  repository: PainIssueRepository,
  session: PainIssueSession & IssueTarget,
  body: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<PainIssueSummary>> {
  const at = now();
  return repository.withFamily(session.familyId, async (store) => {
    const loaded = await loadPainIssue(store, session, true);
    if (!loaded.ok) return loaded;
    const parsed = resolvePainIssueRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const transition = transitionPainIssue(loaded.value.issue, {
      kind: 'resolve',
      resolvedOn: parsed.data.resolvedOn,
      today: medicationToday(() => at),
      lastEntryOn: medicationToday(() => new Date(loaded.value.lastRecordedAt)),
    });
    if (!transition.ok) return transition;
    const result = await store.changeStatus(session.profileId, session.issueId, {
      status: 'resolved',
      resolvedOn: parsed.data.resolvedOn,
      kind: 'resolved',
      on: parsed.data.resolvedOn,
      accountId: session.accountId,
      at,
    });
    return result.ok ? { ok: true, value: toPainIssueSummary(result.value) } : result;
  });
}
