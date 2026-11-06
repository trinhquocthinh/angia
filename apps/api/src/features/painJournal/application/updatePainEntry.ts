import { updatePainEntryRequestSchema, type PainEntry } from '@angia/contracts';
import { preparePainEntry } from '../domain/painEntry.js';
import type {
  EntryTarget,
  PainIssueClock,
  PainIssueOutcome,
  PainIssueRepository,
  PainIssueSession,
} from './ports.js';
import { loadPainEntry } from './loadPainEntry.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';
import { toPainEntry } from './toPainEntry.js';

export function updatePainEntry(
  repository: PainIssueRepository,
  session: PainIssueSession & EntryTarget,
  body: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<PainEntry>> {
  const at = now();
  return repository.withFamily(session.familyId, async (store) => {
    const loaded = await loadPainEntry(store, session);
    if (!loaded.ok) return loaded;
    const parsed = updatePainEntryRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const { issue, entry } = loaded.value;
    const prepared = preparePainEntry(
      issue,
      {
        kind: 'update',
        value: {
          level: parsed.data.level ?? entry.level,
          recordedAt: parsed.data.recordedAt ?? entry.recordedAt,
          note: parsed.data.note === undefined ? entry.note : parsed.data.note,
        },
      },
      at,
    );
    if (!prepared.ok) return prepared;
    const value = await store.updateEntry(
      session.profileId,
      session.issueId,
      session.entryId,
      prepared.value,
      { accountId: session.accountId, at },
    );
    return { ok: true, value: toPainEntry(value) };
  });
}
