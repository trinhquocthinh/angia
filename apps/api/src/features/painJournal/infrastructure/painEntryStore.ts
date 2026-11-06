import { painEntries } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PainIssueStore } from '../application/ports.js';
import { painChildWhere } from './painChildWhere.js';
import { readPainEntries } from './readPainEntries.js';

export function painEntryStore(
  tx: FamilyScopedTx,
  familyId: string,
): Pick<PainIssueStore, 'findEntry' | 'insertEntry' | 'updateEntry' | 'deleteEntry'> {
  const findEntry: PainIssueStore['findEntry'] = async (profileId, issueId, entryId) =>
    (await readPainEntries(tx, familyId, profileId, issueId, entryId))[0] ?? null;
  return {
    findEntry,
    insertEntry: async (profileId, issueId, value, audit) => {
      const [row] = await tx
        .insert(painEntries)
        .values({
          familyId,
          healthProfileId: profileId,
          painIssueId: issueId,
          ...value,
          recordedAt: new Date(value.recordedAt),
          createdByAccountId: audit.accountId,
          updatedByAccountId: audit.accountId,
          createdAt: audit.at,
          updatedAt: audit.at,
        })
        .returning({ id: painEntries.id });
      const entry = row && (await findEntry(profileId, issueId, row.id));
      if (!entry) throw new Error('Không đọc được lần ghi vừa tạo');
      return entry;
    },
    updateEntry: async (profileId, issueId, entryId, value, audit) => {
      await tx
        .update(painEntries)
        .set({
          ...value,
          recordedAt: new Date(value.recordedAt),
          updatedByAccountId: audit.accountId,
          updatedAt: audit.at,
        })
        .where(painChildWhere(painEntries, familyId, profileId, issueId, entryId));
      const entry = await findEntry(profileId, issueId, entryId);
      if (!entry) throw new Error('Không đọc được lần ghi vừa sửa');
      return entry;
    },
    deleteEntry: async (profileId, issueId, entryId) => {
      await tx.delete(painEntries).where(painChildWhere(painEntries, familyId, profileId, issueId, entryId));
    },
  };
}
