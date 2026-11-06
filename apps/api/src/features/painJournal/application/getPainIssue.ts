import type { PainIssueDetail } from '@angia/contracts';
import type { IssueTarget, PainIssueOutcome, PainIssueRepository } from './ports.js';
import { loadPainIssue } from './loadPainIssue.js';
import { toPainIssueDetail } from './toPainIssueDetail.js';

export function getPainIssue(
  repository: PainIssueRepository,
  target: IssueTarget,
): Promise<PainIssueOutcome<PainIssueDetail>> {
  return repository.withFamily(target.familyId, async (store) => {
    const loaded = await loadPainIssue(store, target, false);
    if (!loaded.ok) return loaded;
    const detail = await store.getDetail(target.profileId, target.issueId);
    return detail ? { ok: true, value: toPainIssueDetail(detail) } : { ok: false, code: 'ERR_NOT_FOUND' };
  });
}
