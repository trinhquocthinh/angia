import { painIssues, painIssueStatusEvents } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PainIssueStatusChange } from '../application/ports.js';
import { withPainWrite } from './withPainWrite.js';
import { findTrackingPainIssue } from './findTrackingPainIssue.js';
import { painIssueWhere } from './painIssueWhere.js';
import { readPainSummaries } from './readPainSummaries.js';

export async function changeStoredPainStatus(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
  value: PainIssueStatusChange,
) {
  const [issue] = await tx
    .select()
    .from(painIssues)
    .where(painIssueWhere(familyId, profileId, issueId));
  if (!issue) throw new Error('Không tìm thấy vấn đề đang đổi trạng thái');
  return withPainWrite(
    tx,
    async (savepoint) => {
      await savepoint
        .update(painIssues)
        .set({
          status: value.status,
          resolvedOn: value.resolvedOn,
          updatedByAccountId: value.accountId,
          updatedAt: value.at,
        })
        .where(painIssueWhere(familyId, profileId, issueId));
      await savepoint.insert(painIssueStatusEvents).values({
        familyId,
        healthProfileId: profileId,
        painIssueId: issueId,
        kind: value.kind,
        onDate: value.on,
        actorAccountId: value.accountId,
        createdAt: value.at,
      });
      const summary = (await readPainSummaries(savepoint, familyId, profileId, 'all', issueId))[0];
      if (!summary) throw new Error('Không đọc được vấn đề vừa đổi trạng thái');
      return summary;
    },
    () => findTrackingPainIssue(tx, familyId, profileId, issue, issueId),
  );
}
