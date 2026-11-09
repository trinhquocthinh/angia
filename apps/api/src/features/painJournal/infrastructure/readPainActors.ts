import { inArray } from 'drizzle-orm';
import type { ActorRef } from '@angia/contracts';
import { accounts } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

export async function readPainActors(tx: FamilyScopedTx, ids: (string | null)[]) {
  const uniqueIds = [...new Set(ids.filter((id): id is string => id !== null))];
  const rows =
    uniqueIds.length === 0
      ? []
      : await tx
          .select({ accountId: accounts.id, displayName: accounts.displayName })
          .from(accounts)
          .where(inArray(accounts.id, uniqueIds));
  const actors = new Map<string, ActorRef>(rows.map((row) => [row.accountId, row]));
  return (id: string | null): ActorRef => (id === null ? null : (actors.get(id) ?? null));
}
