import { and, eq } from 'drizzle-orm';
import type { painEntries, exerciseNotes, painIssueStatusEvents } from '@src/shared/db/schema/index.js';

export function painChildWhere(
  table: typeof painEntries | typeof exerciseNotes | typeof painIssueStatusEvents,
  familyId: string,
  profileId: string,
  issueId: string,
  childId?: string,
) {
  return and(
    eq(table.familyId, familyId),
    eq(table.healthProfileId, profileId),
    eq(table.painIssueId, issueId),
    childId === undefined ? undefined : eq(table.id, childId),
  );
}
