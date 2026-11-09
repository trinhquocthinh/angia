import { and, asc, eq, exists, gte, inArray, lte, or, sql } from 'drizzle-orm';
import { bodyRegions } from '@angia/contracts';
import { readPainActors } from '@src/features/painJournal/infrastructure/readPainActors.js';
import { exerciseNotes, painEntries, painIssues } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { VisitSummaryPainIssue } from '../domain/VisitSummary.js';

type Scope = { tx: FamilyScopedTx; familyId: string; from: string; to: string };
type IssueRow = Omit<VisitSummaryPainIssue, 'entries' | 'exercises'> & { id: string };

const regionOrder: string[] = Object.keys(bodyRegions);
const sideOrder: string[] = ['left', 'right', 'center'];

// Ngày của lần ghi tính theo giờ Việt Nam, như dòng thời gian (SPEC-049).
const entryInRange = ({ familyId, from, to }: Scope) =>
  and(
    eq(painEntries.familyId, familyId),
    sql`(${painEntries.recordedAt} AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN ${from}::date AND ${to}::date`,
  );

// BR-064: vấn đề đang tracking (trạng thái hiện tại = tại ngày tạo) cộng vấn đề có lần ghi trong [from, to].
// Thứ tự: tracking trước, rồi vùng theo danh mục bodyRegions, rồi bên.
export async function listSummaryPainIssues(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  from: string,
  to: string,
): Promise<VisitSummaryPainIssue[]> {
  const scope = { tx, familyId, from, to };
  const issues = await readIssues(scope, profileId);
  if (issues.length === 0) return [];
  const ids = issues.map((issue) => issue.id);
  const [entries, exercises] = [await readEntries(scope, ids), await readExercises(scope, ids)];
  return issues.sort(compareIssues).map(({ id, ...issue }) => ({
    ...issue,
    entries: entries.filter((entry) => entry.issueId === id).map(({ issueId: _, ...entry }) => entry),
    exercises: exercises.filter((item) => item.issueId === id).map(({ issueId: _, ...item }) => item),
  }));
}

function readIssues(scope: Scope, profileId: string): Promise<IssueRow[]> {
  const hasEntryInRange = scope.tx
    .select({ id: painEntries.id })
    .from(painEntries)
    .where(and(eq(painEntries.painIssueId, painIssues.id), entryInRange(scope)));
  return scope.tx
    .select({
      id: painIssues.id,
      region: painIssues.region,
      side: painIssues.side,
      title: painIssues.title,
      status: painIssues.status,
      resolvedOn: painIssues.resolvedOn,
    })
    .from(painIssues)
    .where(
      and(
        eq(painIssues.familyId, scope.familyId),
        eq(painIssues.healthProfileId, profileId),
        or(eq(painIssues.status, 'tracking'), exists(hasEntryInRange)),
      ),
    );
}

async function readEntries(scope: Scope, ids: string[]) {
  const rows = await scope.tx
    .select()
    .from(painEntries)
    .where(and(inArray(painEntries.painIssueId, ids), entryInRange(scope)))
    .orderBy(asc(painEntries.recordedAt), asc(painEntries.id));
  const actor = await readPainActors(
    scope.tx,
    rows.map((row) => row.createdByAccountId),
  );
  return rows.map((row) => ({
    issueId: row.painIssueId,
    recordedAt: row.recordedAt.toISOString(),
    level: row.level,
    note: row.note,
    createdBy: actor(row.createdByAccountId),
  }));
}

function readExercises({ tx, familyId, from, to }: Scope, ids: string[]) {
  return tx
    .select({
      issueId: exerciseNotes.painIssueId,
      name: exerciseNotes.name,
      source: exerciseNotes.source,
      prescriber: exerciseNotes.prescriber,
      startDate: exerciseNotes.startDate,
      endDate: exerciseNotes.endDate,
      note: exerciseNotes.note,
    })
    .from(exerciseNotes)
    .where(
      and(
        eq(exerciseNotes.familyId, familyId),
        inArray(exerciseNotes.painIssueId, ids),
        lte(exerciseNotes.startDate, to),
        gte(sql`COALESCE(${exerciseNotes.endDate}, ${to}::date)`, from),
      ),
    )
    .orderBy(asc(exerciseNotes.startDate), asc(exerciseNotes.id));
}

function compareIssues(a: IssueRow, b: IssueRow): number {
  return (
    Number(a.status !== 'tracking') - Number(b.status !== 'tracking') ||
    regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region) ||
    sideOrder.indexOf(a.side) - sideOrder.indexOf(b.side) ||
    a.id.localeCompare(b.id)
  );
}
