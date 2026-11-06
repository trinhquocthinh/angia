import type { PainIssueDeletionImpact } from '@angia/contracts';
import type { IssueTarget, PainIssueOutcome, PainIssueRepository } from './ports.js';
import { loadPainIssue } from './loadPainIssue.js';

export function getPainIssueDeletionImpact(
  repository: PainIssueRepository,
  target: IssueTarget,
): Promise<PainIssueOutcome<PainIssueDeletionImpact>> {
  return repository.withFamily(target.familyId, async (store) => {
    const loaded = await loadPainIssue(store, target, false);
    if (!loaded.ok) return loaded;
    const { entryCount, exerciseCount } = await store.countImpact(target.profileId, target.issueId);
    return { ok: true, value: { entryCount, exerciseCount } };
  });
}
