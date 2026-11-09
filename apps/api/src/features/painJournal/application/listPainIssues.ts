import { painIssueQuerySchema, type PainIssueList } from '@angia/contracts';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { PainIssueOutcome, PainIssueRepository, ProfileTarget } from './ports.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';
import { toPainIssueSummary } from './toPainIssueSummary.js';

export function listPainIssues(
  repository: PainIssueRepository,
  target: ProfileTarget,
  query: unknown,
): Promise<PainIssueOutcome<PainIssueList>> {
  return repository.withFamily(target.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(target.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const parsed = painIssueQuerySchema.safeParse(query);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const issues = (await store.listIssues(target.profileId, parsed.data.status)).map(toPainIssueSummary);
    issues.sort(
      (a, b) =>
        Number(b.status === 'tracking') - Number(a.status === 'tracking') ||
        Date.parse(b.lastEntry.recordedAt) - Date.parse(a.lastEntry.recordedAt),
    );
    return { ok: true, value: { issues } };
  });
}
