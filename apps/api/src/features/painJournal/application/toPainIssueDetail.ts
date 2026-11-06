import type { PainIssueDetail } from '@angia/contracts';
import { toPainActor } from './toPainActor.js';
import { toPainIssueSummary } from './toPainIssueSummary.js';

export function toPainIssueDetail(issue: PainIssueDetail): PainIssueDetail {
  return {
    ...toPainIssueSummary(issue),
    entries: issue.entries
      .map((entry) => ({
        id: entry.id,
        level: entry.level,
        recordedAt: entry.recordedAt,
        note: entry.note,
        createdBy: toPainActor(entry.createdBy),
        updatedBy: toPainActor(entry.updatedBy),
        updatedAt: entry.updatedAt,
      }))
      .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)),
    exercises: issue.exercises
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        source: exercise.source,
        prescriber: exercise.prescriber,
        startDate: exercise.startDate,
        endDate: exercise.endDate,
        note: exercise.note,
        createdBy: toPainActor(exercise.createdBy),
        updatedBy: toPainActor(exercise.updatedBy),
        updatedAt: exercise.updatedAt,
      }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    statusEvents: issue.statusEvents
      .map((event) => ({
        kind: event.kind,
        on: event.on,
        by: toPainActor(event.by),
        at: event.at,
      }))
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
  };
}
