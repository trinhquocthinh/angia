import { sql } from 'drizzle-orm';
import {
  check,
  date,
  foreignKey,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, idColumn, selfIsolationPolicy } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

export const painIssues = pgTable(
  'pain_issues',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id').notNull(),
    region: text('region').notNull(),
    side: text('side', { enum: ['left', 'right', 'center'] }).notNull(),
    title: text('title'),
    status: text('status', { enum: ['tracking', 'resolved'] }).notNull(),
    resolvedOn: date('resolved_on'),
    createdByAccountId: uuid('created_by_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    updatedByAccountId: uuid('updated_by_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    createdAt: createdAtColumn(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('pain_issues_id_family_unique').on(t.id, t.familyId),
    foreignKey({
      name: 'pain_issues_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    uniqueIndex('pain_issues_tracking_region_unique')
      .on(t.healthProfileId, t.region, t.side)
      .where(sql`${t.status} = 'tracking'`),
    index('pain_issues_profile_status_idx').on(t.healthProfileId, t.status),
    check('pain_issues_side_valid', sql`${t.side} IN ('left', 'right', 'center')`),
    check('pain_issues_status_valid', sql`${t.status} IN ('tracking', 'resolved')`),
    check('pain_issues_resolved_on_valid', sql`(${t.status} = 'resolved') = (${t.resolvedOn} IS NOT NULL)`),
    check('pain_issues_title_length', sql`char_length(${t.title}) <= 60`),
    selfIsolationPolicy('health_profile_id'),
  ],
);

// Tech Spec §3.10.1: application kiểm hồ sơ con khớp vấn đề cha khi INSERT; FK ghép bảo vệ gia đình.
export const painEntries = pgTable(
  'pain_entries',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    painIssueId: uuid('pain_issue_id').notNull(),
    healthProfileId: uuid('health_profile_id').notNull(),
    level: smallint('level').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    note: text('note'),
    createdByAccountId: uuid('created_by_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    updatedByAccountId: uuid('updated_by_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    createdAt: createdAtColumn(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: 'pain_entries_issue_family_fk',
      columns: [t.painIssueId, t.familyId],
      foreignColumns: [painIssues.id, painIssues.familyId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'pain_entries_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    index('pain_entries_issue_recorded_idx').on(t.painIssueId, t.recordedAt),
    index('pain_entries_profile_recorded_idx').on(t.healthProfileId, t.recordedAt),
    check('pain_entries_level_range', sql`${t.level} BETWEEN 1 AND 10`),
    check('pain_entries_note_length', sql`char_length(${t.note}) <= 500`),
    selfIsolationPolicy('health_profile_id'),
  ],
);

export const exerciseNotes = pgTable(
  'exercise_notes',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    painIssueId: uuid('pain_issue_id').notNull(),
    healthProfileId: uuid('health_profile_id').notNull(),
    name: text('name').notNull(),
    source: text('source', { enum: ['prescribed', 'self'] }).notNull(),
    prescriber: text('prescriber'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    note: text('note'),
    createdByAccountId: uuid('created_by_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    updatedByAccountId: uuid('updated_by_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    createdAt: createdAtColumn(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: 'exercise_notes_issue_family_fk',
      columns: [t.painIssueId, t.familyId],
      foreignColumns: [painIssues.id, painIssues.familyId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'exercise_notes_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    index('exercise_notes_issue_start_idx').on(t.painIssueId, t.startDate),
    index('exercise_notes_profile_start_idx').on(t.healthProfileId, t.startDate),
    check('exercise_notes_source_valid', sql`${t.source} IN ('prescribed', 'self')`),
    check(
      'exercise_notes_prescriber_source_valid',
      sql`${t.source} = 'prescribed' OR ${t.prescriber} IS NULL`,
    ),
    check('exercise_notes_dates_valid', sql`${t.endDate} IS NULL OR ${t.endDate} >= ${t.startDate}`),
    check('exercise_notes_name_length', sql`char_length(${t.name}) BETWEEN 1 AND 100`),
    check('exercise_notes_prescriber_length', sql`char_length(${t.prescriber}) <= 100`),
    check('exercise_notes_note_length', sql`char_length(${t.note}) <= 1000`),
    selfIsolationPolicy('health_profile_id'),
  ],
);

export const painIssueStatusEvents = pgTable(
  'pain_issue_status_events',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    painIssueId: uuid('pain_issue_id').notNull(),
    healthProfileId: uuid('health_profile_id').notNull(),
    kind: text('kind', { enum: ['resolved', 'reopened'] }).notNull(),
    onDate: date('on_date').notNull(),
    actorAccountId: uuid('actor_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    foreignKey({
      name: 'pain_issue_status_events_issue_family_fk',
      columns: [t.painIssueId, t.familyId],
      foreignColumns: [painIssues.id, painIssues.familyId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'pain_issue_status_events_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    index('pain_issue_status_events_issue_created_idx').on(t.painIssueId, t.createdAt),
    index('pain_issue_status_events_profile_on_idx').on(t.healthProfileId, t.onDate),
    check('pain_issue_status_events_kind_valid', sql`${t.kind} IN ('resolved', 'reopened')`),
    selfIsolationPolicy('health_profile_id'),
  ],
);
