import { sql } from 'drizzle-orm';
import {
  painIssues as issues,
  painEntries as entries,
  exerciseNotes as exercises,
} from '@src/shared/db/schema/index.js';

const ofIssue = sql`${entries.familyId} = ${issues.familyId} AND ${entries.healthProfileId} = ${issues.healthProfileId} AND ${entries.painIssueId} = ${issues.id}`;

export const painSummaryColumns = {
  id: issues.id,
  region: issues.region,
  side: issues.side,
  title: issues.title,
  status: issues.status,
  resolvedOn: issues.resolvedOn,
  createdBy: issues.createdByAccountId,
  updatedBy: issues.updatedByAccountId,
  updatedAt: issues.updatedAt,
  level: sql<number>`(SELECT ${entries.level} FROM ${entries} WHERE ${ofIssue} ORDER BY ${entries.recordedAt} DESC, ${entries.id} DESC LIMIT 1)`,
  recordedAt:
    sql`(SELECT ${entries.recordedAt} FROM ${entries} WHERE ${ofIssue} ORDER BY ${entries.recordedAt} DESC, ${entries.id} DESC LIMIT 1)`.mapWith(
      entries.recordedAt,
    ),
  entryCount: sql`(SELECT count(*) FROM ${entries} WHERE ${ofIssue})`.mapWith(Number),
  exerciseCount:
    sql`(SELECT count(*) FROM ${exercises} WHERE ${exercises.familyId} = ${issues.familyId} AND ${exercises.healthProfileId} = ${issues.healthProfileId} AND ${exercises.painIssueId} = ${issues.id})`.mapWith(
      Number,
    ),
};
