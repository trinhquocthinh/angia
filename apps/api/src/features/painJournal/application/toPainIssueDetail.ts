import type { PainIssueDetail } from '@angia/contracts';
import { toPainEntry } from './toPainEntry.js';
import { toExerciseNote } from './toExerciseNote.js';
import { toPainActor } from './toPainActor.js';
import { toPainIssueSummary } from './toPainIssueSummary.js';

export function toPainIssueDetail(issue: PainIssueDetail): PainIssueDetail {
  return {
    ...toPainIssueSummary(issue),
    entries: issue.entries
      .map(toPainEntry)
      .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)),
    exercises: issue.exercises.map(toExerciseNote).sort((a, b) => a.startDate.localeCompare(b.startDate)),
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
