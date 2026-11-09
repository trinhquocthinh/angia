import { asc } from 'drizzle-orm';
import type { PainIssueStatusEvent } from '@angia/contracts';
import { painIssueStatusEvents as events } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { painChildWhere } from './painChildWhere.js';
import { readPainActors } from './readPainActors.js';

export async function readPainStatusEvents(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
): Promise<PainIssueStatusEvent[]> {
  const rows = await tx
    .select()
    .from(events)
    .where(painChildWhere(events, familyId, profileId, issueId))
    .orderBy(asc(events.createdAt), asc(events.id));
  const actor = await readPainActors(
    tx,
    rows.map((r) => r.actorAccountId),
  );
  return rows.map((r) => ({
    kind: r.kind,
    on: r.onDate,
    by: actor(r.actorAccountId),
    at: r.createdAt.toISOString(),
  }));
}
