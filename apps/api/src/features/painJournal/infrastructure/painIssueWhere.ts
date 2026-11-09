import { and, eq } from 'drizzle-orm';
import { painIssues } from '@src/shared/db/schema/index.js';

export function painIssueWhere(familyId: string, profileId: string, issueId?: string) {
  return and(
    eq(painIssues.familyId, familyId),
    eq(painIssues.healthProfileId, profileId),
    issueId === undefined ? undefined : eq(painIssues.id, issueId),
  );
}
