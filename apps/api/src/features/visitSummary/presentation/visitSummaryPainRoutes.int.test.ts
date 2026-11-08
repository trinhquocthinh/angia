import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, VisitSummary } from '@angia/contracts';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const profiles = '/api/health-profiles';
const range = '?from=2026-07-01&to=2026-09-30';

describe('Mục đau nhức trong bản tóm tắt tái khám (SPEC-024 v0.3, BR-064)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  const fixture = async (birthYear = 1950) => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', profiles, { birthYear, displayName: 'Mẹ' });
    const profile = (await created.json()) as HealthProfile;
    await confirmConsentByAttestation(t, main, profile.id);
    const scope = [familyId, profile.id];
    const issue = async (region: string, side: string, resolvedOn: string | null = null) => {
      const id = randomUUID();
      await t.owner.query(
        `INSERT INTO pain_issues(id,family_id,health_profile_id,region,side,status,resolved_on)
         VALUES ($3,$1,$2,$4,$5,$6,$7)`,
        [...scope, id, region, side, resolvedOn ? 'resolved' : 'tracking', resolvedOn],
      );
      return id;
    };
    const entry = (issueId: string, recordedAt: string, level: number, note: string | null = null) =>
      t.owner.query(
        `INSERT INTO pain_entries(id,family_id,health_profile_id,pain_issue_id,level,recorded_at,note,created_by_account_id)
         VALUES ($4,$1,$2,$3,$5,$6,$7,$8)`,
        [...scope, issueId, randomUUID(), level, recordedAt, note, main.accountId],
      );
    const exercise = (issueId: string, name: string, startDate: string, endDate: string | null) =>
      t.owner.query(
        `INSERT INTO exercise_notes(id,family_id,health_profile_id,pain_issue_id,name,source,prescriber,start_date,end_date)
         VALUES ($4,$1,$2,$3,$5,'prescribed','BS. Lan',$6,$7)`,
        [...scope, issueId, randomUUID(), name, startDate, endDate],
      );
    const base = `${profiles}/${profile.id}`;
    return { familyId, main, profile, base, issue, entry, exercise };
  };
  const getSummary = async (f: Awaited<ReturnType<typeof fixture>>) => {
    const response = await t.call(f.main, 'GET', `${f.base}/visit-summary${range}`);
    expect(response.status).toBe(200);
    return (await response.json()) as VisitSummary;
  };

  it('TC-711: tracking không lần ghi + resolved có lần ghi trong khoảng; bỏ resolved ngoài khoảng', async () => {
    const f = await fixture();
    const a = await f.issue('knee', 'left');
    await f.entry(a, '2026-06-15T02:00:00Z', 5);
    const neck = await f.issue('neck', 'center');
    await f.entry(neck, '2026-06-20T02:00:00Z', 3);
    const b = await f.issue('shoulder', 'right', '2026-09-20');
    await f.entry(b, '2026-08-10T01:00:00Z', 7, 'Sau khi bê đồ');
    await f.entry(b, '2026-06-30T17:30:00Z', 2); // 00:30 ngày 01/07 giờ VN — trong khoảng.
    await f.entry(b, '2026-09-01T03:00:00Z', 4);
    await f.entry(b, '2026-09-30T17:00:00Z', 9); // 00:00 ngày 01/10 giờ VN — ngoài khoảng.
    const c = await f.issue('head', 'center', '2026-05-10');
    await f.entry(c, '2026-05-01T02:00:00Z', 6);
    await f.exercise(b, 'Xoay vai', '2026-08-01', null);
    await f.exercise(b, 'Kéo giãn cũ', '2026-05-01', '2026-06-30');
    await f.exercise(b, 'Bài sau khoảng', '2026-10-01', null);
    await f.exercise(a, 'Duỗi gối', '2026-06-01', '2026-07-01');

    const { painIssues } = await getSummary(f);
    expect(painIssues.map((i) => [i.region, i.side, i.status])).toEqual([
      ['neck', 'center', 'tracking'],
      ['knee', 'left', 'tracking'],
      ['shoulder', 'right', 'resolved'],
    ]);
    const [, knee, shoulder] = painIssues;
    expect(knee).toMatchObject({ title: null, resolvedOn: null, entries: [] });
    expect(knee!.exercises.map((x) => x.name)).toEqual(['Duỗi gối']);
    expect(shoulder!.resolvedOn).toBe('2026-09-20');
    expect(shoulder!.entries).toEqual([
      {
        recordedAt: '2026-06-30T17:30:00.000Z',
        level: 2,
        note: null,
        createdBy: { accountId: f.main.accountId, displayName: expect.any(String) },
      },
      expect.objectContaining({ recordedAt: '2026-08-10T01:00:00.000Z', level: 7, note: 'Sau khi bê đồ' }),
      expect.objectContaining({ recordedAt: '2026-09-01T03:00:00.000Z', level: 4 }),
    ]);
    expect(shoulder!.exercises).toEqual([
      {
        name: 'Xoay vai',
        source: 'prescribed',
        prescriber: 'BS. Lan',
        startDate: '2026-08-01',
        endDate: null,
        note: null,
      },
    ]);
  });

  it('TC-712: hồ sơ trẻ chưa bật số đo vẫn có đủ mục đau nhức', async () => {
    const f = await fixture(new Date().getFullYear() - 5);
    await t.owner.query('UPDATE health_profiles SET vitals_enabled = NULL WHERE id = $1', [f.profile.id]);
    const issueId = await f.issue('knee', 'right');
    await f.entry(issueId, '2026-08-01T02:00:00Z', 3);
    const summary = await getSummary(f);
    expect(summary.showsVitals).toBe(false);
    expect(summary.painIssues).toHaveLength(1);
    expect(summary.painIssues[0]!.entries).toHaveLength(1);
  });

  it('TC-717: hồ sơ withdrawn → ERR_CONSENT_REQUIRED ở tóm tắt và dòng thời gian, không lọt dữ liệu đau', async () => {
    const f = await fixture();
    const issueId = await f.issue('knee', 'left');
    await f.entry(issueId, '2026-08-01T02:00:00Z', 8, 'Ghi chú riêng tư');
    await t.owner.query(
      "UPDATE health_profiles SET consent_status='withdrawn', consent_withdrawn_at=now(), consent_withdrawn_by=$2 WHERE id=$1",
      [f.profile.id, f.main.accountId],
    );
    for (const path of [`${f.base}/visit-summary${range}`, `${f.base}/timeline`]) {
      const response = await t.call(f.main, 'GET', path);
      expect(response.status).toBe(409);
      const body = await response.text();
      expect(JSON.parse(body)).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
      expect(body).not.toContain('Ghi chú riêng tư');
      expect(body).not.toContain(issueId);
    }
  });
});
