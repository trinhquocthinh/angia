import { createPainEntryRequestSchema, type PainEntry } from '@angia/contracts';
import { preparePainEntry } from '../domain/painEntry.js';
import type {
  IssueTarget,
  PainIssueClock,
  PainIssueOutcome,
  PainIssueRepository,
  PainIssueSession,
} from './ports.js';
import { loadPainIssue } from './loadPainIssue.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';
import { toPainEntry } from './toPainEntry.js';

export function createPainEntry(
  repository: PainIssueRepository,
  session: PainIssueSession & IssueTarget,
  body: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<PainEntry>> {
  const at = now();
  return repository.withFamily(session.familyId, async (store) => {
    const loaded = await loadPainIssue(store, session, true);
    if (!loaded.ok) return loaded;
    const parsed = createPainEntryRequestSchema.safeParse(body);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    const prepared = preparePainEntry(
      loaded.value.issue,
      {
        kind: 'create',
        value: {
          level: parsed.data.level,
          recordedAt: parsed.data.recordedAt ?? at.toISOString(),
          note: parsed.data.note ?? null,
        },
      },
      at,
    );
    if (!prepared.ok) return prepared;
    const value = await store.insertEntry(session.profileId, session.issueId, prepared.value, {
      accountId: session.accountId,
      at,
    });
    return { ok: true, value: toPainEntry(value) };
  });
}
