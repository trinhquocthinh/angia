import type { BodyLocation } from '@angia/contracts';
import { painIssues } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PainIssueAudit } from '../application/ports.js';
import { withPainWrite } from './withPainWrite.js';
import { findTrackingPainIssue } from './findTrackingPainIssue.js';
import { painIssueWhere } from './painIssueWhere.js';
import { readPainSummaries } from './readPainSummaries.js';

export function updateStoredPainIssue(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
  value: BodyLocation & { title: string | null },
  audit: PainIssueAudit,
) {
  return withPainWrite(
    tx,
    async (savepoint) => {
      await savepoint
        .update(painIssues)
        .set({ ...value, updatedByAccountId: audit.accountId, updatedAt: audit.at })
        .where(painIssueWhere(familyId, profileId, issueId));
      const summary = (await readPainSummaries(savepoint, familyId, profileId, 'all', issueId))[0];
      if (!summary) throw new Error('Không đọc được vấn đề vừa sửa');
      return summary;
    },
    () => findTrackingPainIssue(tx, familyId, profileId, value, issueId),
  );
}
