import { painIssues } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { NewPainIssue } from '../application/ports.js';
import { withPainWrite } from './withPainWrite.js';
import { findTrackingPainIssue } from './findTrackingPainIssue.js';
import { painEntryStore } from './painEntryStore.js';
import { readPainDetail } from './readPainDetail.js';

export function insertStoredPainIssue(tx: FamilyScopedTx, familyId: string, input: NewPainIssue) {
  return withPainWrite(
    tx,
    async (savepoint) => {
      const [row] = await savepoint
        .insert(painIssues)
        .values({
          familyId,
          healthProfileId: input.profileId,
          region: input.region,
          side: input.side,
          title: input.title,
          status: 'tracking',
          createdByAccountId: input.accountId,
          updatedByAccountId: input.accountId,
          createdAt: input.at,
          updatedAt: input.at,
        })
        .returning({ id: painIssues.id });
      if (!row) throw new Error('Không tạo được vấn đề đau');
      await painEntryStore(savepoint, familyId).insertEntry(input.profileId, row.id, input.firstEntry, input);
      const detail = await readPainDetail(savepoint, familyId, input.profileId, row.id);
      if (!detail) throw new Error('Không đọc được vấn đề vừa tạo');
      return detail;
    },
    () => findTrackingPainIssue(tx, familyId, input.profileId, input),
  );
}
