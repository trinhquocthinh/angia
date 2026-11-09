import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { PainEntry } from '@angia/contracts';
import type { EntryTarget, PainIssueOutcome, PainIssueStore, StoredPainIssue } from './ports.js';

export async function loadPainEntry(
  store: PainIssueStore,
  target: EntryTarget,
): Promise<PainIssueOutcome<StoredPainIssue & { entry: PainEntry }>> {
  const found = await store.findIssue(target.profileId, target.issueId, true);
  if (!found || found.issue.healthProfileId !== target.profileId || found.issue.id !== target.issueId) {
    return { ok: false, code: 'ERR_NOT_FOUND' };
  }
  const entry = await store.findEntry(target.profileId, target.issueId, target.entryId);
  if (!entry || entry.id !== target.entryId) return { ok: false, code: 'ERR_NOT_FOUND' };
  const blocked = consentGate(found.consentStatus);
  return blocked ? { ok: false, code: blocked } : { ok: true, value: { ...found, entry } };
}
