import { deletePainIssueRequestSchema } from '@angia/contracts';
import type { IssueTarget, PainIssueOutcome, PainIssueRepository } from './ports.js';
import { loadPainIssue } from './loadPainIssue.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';

export function deletePainIssue(
  repository: PainIssueRepository,
  target: IssueTarget,
  body: unknown,
): Promise<PainIssueOutcome<null>> {
  return repository.withFamily(target.familyId, async (store) => {
    const loaded = await loadPainIssue(store, target, true);
    if (!loaded.ok) return loaded;
    const parsed = deletePainIssueRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    await store.deleteIssue(target.profileId, target.issueId);
    return { ok: true, value: null };
  });
}
