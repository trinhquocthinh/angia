import { checkPainEntryDeletion } from '../domain/checkPainEntryDeletion.js';
import type { EntryTarget, PainIssueOutcome, PainIssueRepository } from './ports.js';
import { loadPainEntry } from './loadPainEntry.js';

export function deletePainEntry(
  repository: PainIssueRepository,
  target: EntryTarget,
): Promise<PainIssueOutcome<null>> {
  return repository.withFamily(target.familyId, async (store) => {
    const loaded = await loadPainEntry(store, target);
    if (!loaded.ok) return loaded;
    const impact = await store.countImpact(target.profileId, target.issueId);
    const allowed = checkPainEntryDeletion(impact.entryCount);
    if (!allowed.ok) return allowed;
    await store.deleteEntry(target.profileId, target.issueId, target.entryId);
    return { ok: true, value: null };
  });
}
