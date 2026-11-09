import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { timelinePageSchema, type HealthProfile, type TimelinePage } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedTimelineData } from '@src/shared/test/seedTimelineData.js';
import { seedTimelinePainData } from '@src/shared/test/seedTimelinePainData.js';
import { linkAccount } from '@src/shared/test/seedSelfProfileData.js';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';

const painKinds = new Set(['pain_entry', 'pain_issue_status', 'exercise_started']);

describe('Dòng thời gian ba loại sổ đau nhức (SPEC-049 v0.3)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());
  const read = async (session: SeededSession, path: string) => {
    const response = await t.call(session, 'GET', path);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    return timelinePageSchema.parse(await response.json());
  };
  const walk = async (session: SeededSession, path: string) => {
    const items: TimelinePage['items'] = [];
    let next: string | null = null;
    do {
      const page = await read(session, `${path}?limit=1${next ? `&cursor=${next}` : ''}`);
      items.push(...page.items);
      next = page.nextCursor;
    } while (next && items.length < 100);
    return items;
  };

  it('TC-715: đủ 3 loại mới, ID nguồn, ngày giờ VN, thứ tự và cursor như 8 loại cũ', async () => {
    const f = await seedTimelineData(t);
    const pain = await seedTimelinePainData(t, { familyId: f.familyId, profileId: f.profile.id });
    const page = await read(f.main, f.path);
    const at = { issueId: pain.issueId, region: 'knee', side: 'left' };
    expect(page.items.filter((e) => painKinds.has(e.kind))).toEqual([
      {
        id: pain.reopenedId,
        kind: 'pain_issue_status',
        date: '2026-11-01',
        time: null,
        data: { ...at, change: 'reopened' },
      },
      {
        id: pain.lateEntryId,
        kind: 'pain_entry',
        date: '2026-10-31',
        time: '10:15',
        data: { ...at, level: 6, note: 'Sau khi leo cầu thang' },
      },
      {
        id: pain.resolvedId,
        kind: 'pain_issue_status',
        date: '2026-10-31',
        time: null,
        data: { ...at, change: 'resolved' },
      },
      {
        id: pain.earlyEntryId,
        kind: 'pain_entry',
        date: '2026-10-30',
        time: '00:30',
        data: { ...at, level: 4, note: null },
      },
      {
        id: pain.exerciseId,
        kind: 'exercise_started',
        date: '2026-10-30',
        time: null,
        data: { ...at, exerciseId: pain.exerciseId, name: 'Duỗi gối', source: 'prescribed' },
      },
    ]);
    const kinds = page.items.map((e) => e.kind);
    // Cùng ngày 30, không giờ: xếp theo kind sau adherence_period/course_stopped, trước revisit.
    expect(kinds.indexOf('course_stopped')).toBeGreaterThan(-1);
    expect(kinds.indexOf('exercise_started')).toBeGreaterThan(kinds.indexOf('course_stopped'));
    expect(kinds.indexOf('exercise_started')).toBeLessThan(kinds.indexOf('revisit'));
    expect(page.items[0]!.id).toBe(pain.reopenedId);
    expect(await walk(f.main, f.path)).toEqual(page.items);
  });

  it('TC-716: hồ sơ trẻ ẩn số đo vẫn có sự kiện đau; tự quản của M chỉ thấy hồ sơ Mẹ', async () => {
    const f = await seedTimelineData(t);
    const child = (await (
      await t.call(f.main, 'POST', '/api/health-profiles', { displayName: 'Bé An', birthYear: 2020 })
    ).json()) as HealthProfile;
    await confirmConsentByAttestation(t, f.main, child.id);
    const childPain = await seedTimelinePainData(t, { familyId: f.familyId, profileId: child.id });
    const motherPain = await seedTimelinePainData(t, { familyId: f.familyId, profileId: f.profile.id });
    await t.owner.query(
      `INSERT INTO measurements(id,family_id,health_profile_id,kind,measured_on,systolic,diastolic,manual_without_source)
       VALUES ($1,$2,$3,'blood_pressure','2026-10-30',120,80,true)`,
      [randomUUID(), f.familyId, child.id],
    );
    const childPage = await read(f.main, `/api/health-profiles/${child.id}/timeline`);
    expect(childPage.items.map((e) => e.kind)).not.toContain('measurement');
    expect(childPage.items.map((e) => e.id).sort()).toEqual(
      Object.values(childPain)
        .filter((id) => id !== childPain.issueId)
        .sort(),
    );
    const member = await t.session(f.familyId, 'member');
    await linkAccount(t, member.accountId, f.profile.id);
    const self = await walk(member, '/api/me/profile/timeline');
    const selfIds = new Set(self.map((e) => e.id));
    expect(selfIds.has(motherPain.lateEntryId)).toBe(true);
    expect(selfIds.has(motherPain.exerciseId)).toBe(true);
    for (const id of Object.values(childPain)) expect(selfIds.has(id)).toBe(false);
    expect(
      self.filter((e) => painKinds.has(e.kind)).map((e) => (e.data as { issueId: string }).issueId),
    ).toEqual(Array(5).fill(motherPain.issueId));
  });
});
