import { expect } from 'vitest';
import type { HealthProfile, PainIssueDetail, ExerciseNote } from '@angia/contracts';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { startProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

export async function painJournalHttpFixture() {
  const t = await startProfileTestApp(undefined, { now: () => new Date('2026-11-06T10:00:00Z') });
  const profile = async (existingFamilyId?: string) => {
    const familyId = existingFamilyId ?? (await t.family());
    const main = await t.session(familyId);
    const response = await t.call(main, 'POST', '/api/health-profiles', {
      displayName: 'Mẹ',
      birthYear: 1950,
    });
    expect(response.status).toBe(201);
    const { id } = (await response.json()) as HealthProfile;
    await confirmConsentByAttestation(t, main, id);
    const member = await t.session(familyId, 'member');
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [id, member.accountId]);
    return { familyId, profileId: id, main, member };
  };
  const issue = async (p: Awaited<ReturnType<typeof profile>>) => {
    const base = `/api/health-profiles/${p.profileId}/pain-issues`;
    const response = await t.call(p.main, 'POST', base, {
      region: 'knee',
      side: 'left',
      firstEntry: { level: 5, recordedAt: '2026-11-05T00:00:00Z' },
    });
    expect(response.status).toBe(201);
    const value = (await response.json()) as PainIssueDetail;
    await t.call(p.main, 'POST', `${base}/${value.id}/entries`, { level: 4 });
    const exercise = await t.call(p.main, 'POST', `${base}/${value.id}/exercises`, {
      name: 'Duỗi gối',
      source: 'self',
      startDate: '2026-11-05',
    });
    expect(exercise.status).toBe(201);
    return {
      issueId: value.id,
      entryId: value.entries[0]!.id,
      exerciseId: ((await exercise.json()) as ExerciseNote).id,
      profileId: p.profileId,
    };
  };
  return { ...t, profile, issue };
}
export type PainHttpFixture = Awaited<ReturnType<typeof painJournalHttpFixture>>;
export type PainHttpTarget = Awaited<ReturnType<PainHttpFixture['issue']>>;
export const painPath = (base: string, suffix: string, target: PainHttpTarget) =>
  base +
  suffix
    .replace(':issueId', target.issueId)
    .replace(':entryId', target.entryId)
    .replace(':exerciseId', target.exerciseId);
