import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { IssueTarget, PainIssueOutcome, PainIssueStore, StoredPainIssue } from './ports.js';

export async function loadPainIssue(
  store: PainIssueStore,
  target: IssueTarget,
  lock: boolean,
): Promise<PainIssueOutcome<StoredPainIssue>> {
  const found = await store.findIssue(target.profileId, target.issueId, lock);
  if (!found || found.issue.healthProfileId !== target.profileId || found.issue.id !== target.issueId) {
    return { ok: false, code: 'ERR_NOT_FOUND' };
  }
  const blocked = consentGate(found.consentStatus);
  return blocked ? { ok: false, code: blocked } : { ok: true, value: found };
}
