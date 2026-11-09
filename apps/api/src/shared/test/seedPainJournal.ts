import { expect } from 'vitest';
import type { PainIssueDetail, ExerciseNote } from '@angia/contracts';
import type { ProfileTestApp } from './startProfileTestApp.js';
import type { SeededSession } from './seedAuthFixtures.js';

export async function seedPainJournal(t: ProfileTestApp, main: SeededSession, profileId: string) {
  const base = `/api/health-profiles/${profileId}/pain-issues`;
  const response = await t.call(main, 'POST', base, {
    region: 'knee',
    side: 'left',
    firstEntry: { level: 5, recordedAt: '2026-11-05T00:00:00Z' },
  });
  expect(response.status).toBe(201);
  const issue = (await response.json()) as PainIssueDetail;
  const exercise = await t.call(main, 'POST', `${base}/${issue.id}/exercises`, {
    name: 'Duỗi gối',
    source: 'self',
    startDate: '2026-11-05',
  });
  expect(exercise.status).toBe(201);
  return {
    painIssueId: issue.id,
    painEntryId: issue.entries[0]!.id,
    painExerciseId: ((await exercise.json()) as ExerciseNote).id,
  };
}
