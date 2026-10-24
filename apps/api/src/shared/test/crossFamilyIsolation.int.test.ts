import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from './acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from './expectCrossFamilyDenied.js';
import { MEMBER_BLOCKED_SESSION_ROUTES, type RouteOfKind } from './healthDataRoutes.js';
import type { SeededSession } from './seedAuthFixtures.js';
import type { Target, Probe } from './CrossFamilyTarget.js';
import { seedPendingDocument } from './seedPendingDocument.js';
import { seedReminder } from './seedReminder.js';
import { snapshotHealthTables } from './snapshotHealthTables.js';
import {
  manualCourse as course,
  manualPrescription as prescription,
  manualReading as reading,
} from './healthDataFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from './startProfileTestApp.js';

const respondBody = { decision: 'accepted', basis: 'self', respondentName: 'Lén' };
const profiles = '/api/health-profiles';
const documents = '/api/source-documents';
const adherence = { medicationName: 'Canxi', status: 'taking', fromDate: '2026-10-01' };
const seriesQuery = 'kind=blood_pressure&from=2026-10-01&to=2026-10-31';

describe('NFR-4: mọi route dữ liệu sức khỏe chặn truy cập chéo gia đình (E2-S7-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const tokenCall = (path: string, token: string, body?: unknown) =>
    t.app.request(path, {
      method: body ? 'POST' : 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        origin: 'http://localhost:5173',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const upload = (user: SeededSession, profileId: string) => {
    const form = new FormData();
    form.append('files', new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9])], 'a.jpg'));
    return t.app.request(`${profiles}/${profileId}/upload-batches`, {
      method: 'POST',
      headers: { cookie: user.cookie, 'x-csrf-token': user.csrf },
      body: form,
    });
  };
  const probes: Record<RouteOfKind<'scoped'>, Probe> = {
    'POST /api/health-profiles': (u, x) =>
      t.call(u, 'POST', profiles, { displayName: 'Lén', linkedAccountId: x.accountId }),
    'DELETE /api/health-profiles/:id': (u, x) =>
      t.call(u, 'DELETE', `${profiles}/${x.profileId}`, { confirmName: 'Mẹ' }), // tên đúng của nạn nhân
    'POST /api/health-profiles/:id/consent-invitations': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/consent-invitations`),
    'DELETE /api/health-profiles/:id/consent-invitations': (u, x) =>
      t.call(u, 'DELETE', `${profiles}/${x.profileId}/consent-invitations`),
    'GET /api/consent-invitations/view': (_u, x) => tokenCall('/api/consent-invitations/view', x.token),
    'POST /api/consent-invitations/respond': (_u, x) =>
      tokenCall('/api/consent-invitations/respond', x.token, respondBody),
    'POST /api/health-profiles/:id/upload-batches': (u, x) => upload(u, x.profileId),
    'GET /api/source-documents/:id/review': (u, x) => t.call(u, 'GET', `${documents}/${x.documentId}/review`),
    'GET /api/source-documents/:id/image': (u, x) => t.call(u, 'GET', `${documents}/${x.documentId}/image`),
    'POST /api/source-documents/:id/privacy-drafts': (u, x) =>
      t.call(u, 'POST', `${documents}/${x.documentId}/privacy-drafts`, {
        rotation: 0,
        crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 },
        masks: [],
      }),
    'GET /api/source-documents/:id/privacy-draft': (u, x) =>
      t.call(u, 'GET', `${documents}/${x.documentId}/privacy-draft`),
    'GET /api/source-documents/:id/privacy-drafts/:draftId/image': (u, x) =>
      t.call(u, 'GET', `${documents}/${x.documentId}/privacy-drafts/${x.accountId}/image`),
    'POST /api/source-documents/:id/privacy-approval': (u, x) =>
      t.call(u, 'POST', `${documents}/${x.documentId}/privacy-approval`, {
        draftId: x.accountId,
        sha256: 'a'.repeat(64),
        confirmed: true,
      }),
    'POST /api/source-documents/:id/manual-entry': (u, x) =>
      t.call(u, 'POST', `${documents}/${x.documentId}/manual-entry`),
    'POST /api/source-documents/:id/approve': (u, x) =>
      t.call(u, 'POST', `${documents}/${x.documentId}/approve`, { type: 'device_reading', data: reading }),
    'POST /api/source-documents/:id/reject': (u, x) =>
      t.call(u, 'POST', `${documents}/${x.documentId}/reject`),
    'GET /api/health-profiles/:id/measurements': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/measurements`),
    'GET /api/health-profiles/:id/measurements/series': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/measurements/series?${seriesQuery}`),
    'GET /api/health-profiles/:id/lab-result-series': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/lab-result-series`),
    'GET /api/health-profiles/:id/document-entries': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/document-entries`),
    'POST /api/health-profiles/:id/medication-courses': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/medication-courses`, course),
    'GET /api/health-profiles/:id/medication-courses/stoppable': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/medication-courses/stoppable`),
    'GET /api/health-profiles/:id/medication-courses/current': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/medication-courses/current`),
    'POST /api/health-profiles/:id/medication-courses/:courseId/stop': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/medication-courses/${x.courseId}/stop`, {
        stopDate: '2026-10-05',
      }),
    'POST /api/health-profiles/:id/prescriptions/:prescriptionId/reuse': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/prescriptions/${x.prescriptionId}/reuse`, {
        startDate: '2026-10-02',
        items: [{ prescriptionItemId: x.courseId, durationDays: 7, longTerm: false }],
      }),
    'GET /api/health-profiles/:id/adherence-periods': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/adherence-periods`),
    'POST /api/health-profiles/:id/adherence-periods': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/adherence-periods`, { ...adherence, status: 'stopped' }),
    'GET /api/health-profiles/:id/dose-slots': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/dose-slots`),
    'PUT /api/health-profiles/:id/dose-slots': (u, x) =>
      t.call(u, 'PUT', `${profiles}/${x.profileId}/dose-slots`, { slots: { noon: '12:00' } }),
    'GET /api/health-profiles/:id/reminder-recipients': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/reminder-recipients`),
    'PUT /api/health-profiles/:id/reminder-recipients': (u, x) =>
      t.call(u, 'PUT', `${profiles}/${x.profileId}/reminder-recipients`, {
        recipientAccountIds: [x.accountId],
      }),
    'GET /api/health-profiles/:id/visit-summary': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/visit-summary`),
    'GET /api/me/reminders/:reminderId': (u, x) => t.call(u, 'GET', `/api/me/reminders/${x.reminderId}`),
    'POST /api/health-profiles/:id/manual-records': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/manual-records`, {
        type: 'device_reading',
        data: reading,
      }),
  };

  // Gia đình nạn nhân: hồ sơ đã đồng thuận, chứng từ chờ duyệt có ảnh, link mời đã dùng.
  const victimFixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', profiles, { displayName: 'Mẹ' });
    const profile = (await created.json()) as HealthProfile;
    const token = await acceptConsentInvitation(t, main, profile.id);
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const { documentId } = await seedPendingDocument(t, owner, reading);
    const started = await t.call(main, 'POST', `${profiles}/${profile.id}/medication-courses`, course);
    const { id: courseId } = (await started.json()) as { id: string };
    await t.call(main, 'POST', `${profiles}/${profile.id}/adherence-periods`, adherence);
    const body = { type: 'prescription', data: prescription };
    const saved = await t.call(main, 'POST', `${profiles}/${profile.id}/manual-records`, body);
    const { id: prescriptionId } = ((await saved.json()) as { prescription: { id: string } }).prescription;
    const reminderId = await seedReminder(t.owner, familyId, profile.id, main.accountId);
    return { familyId, main, profile, documentId, token, courseId, prescriptionId, reminderId };
  };
  const attackers = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const adminMain = await t.session(familyId, 'main', 'Quản trị kiêm main', true);
    return { familyId, main, adminMain };
  };
  const snapshot = () => snapshotHealthTables(t.owner);

  it('TC-013, TC-014, TC-015, TC-076: main và Quản trị kiêm main nhóm khác nhận đúng phản hồi của ID không tồn tại, không ghi gì', async () => {
    const victim = await victimFixture();
    const { familyId, main, adminMain } = await attackers();
    const target: Target = {
      profileId: victim.profile.id,
      documentId: victim.documentId,
      accountId: victim.main.accountId,
      courseId: victim.courseId,
      prescriptionId: victim.prescriptionId,
      reminderId: victim.reminderId,
      token: t.codec.issue({ ...t.codec.verify(victim.token)!, familyId }),
    };
    const missing: Target = {
      profileId: randomUUID(),
      documentId: randomUUID(),
      accountId: randomUUID(),
      courseId: randomUUID(),
      prescriptionId: randomUUID(),
      reminderId: randomUUID(),
      token: 'bogus',
    };
    const before = await snapshot();
    for (const user of [main, adminMain]) {
      for (const [route, probe] of Object.entries(probes)) {
        await expectCrossFamilyDenied(
          () => probe(user, target),
          () => probe(user, missing),
        ).catch((error: Error) => {
          throw new Error(`${route}: ${error.message}`);
        });
      }
    }
    // Hồ sơ "Lén" không được tạo; dữ liệu nạn nhân (gồm link mời, chứng từ, số đo) giữ nguyên.
    expect(await snapshot()).toEqual(before);
  });

  it('TC-017: danh sách chỉ gồm dữ liệu gia đình của phiên, không lẫn nhóm khác', async () => {
    const victim = await victimFixture();
    for (const name of ['Ba', 'Bà']) await t.call(victim.main, 'POST', profiles, { displayName: name });
    const { familyId, main } = await attackers();
    for (const name of ['A', 'B', 'C', 'D']) await t.call(main, 'POST', profiles, { displayName: name });
    const listPaths: Record<RouteOfKind<'list'>, string> = {
      'GET /api/health-profiles': profiles,
      'GET /api/health-profiles/linkable-accounts': `${profiles}/linkable-accounts`,
      'GET /api/source-documents': `${documents}?status=pending_review`,
    };
    type Item = { id: string; familyId?: string };
    // Danh sách chứng từ trả trang { items, nextCursor } (F09a), các danh sách khác trả mảng.
    const list = async (user: SeededSession, path: string) => {
      const body = (await (await t.call(user, 'GET', path)).json()) as Item[] | { items: Item[] };
      return Array.isArray(body) ? body : body.items;
    };
    const own = (await list(victim.main, profiles)) as HealthProfile[];
    expect(own).toHaveLength(3);
    expect(own.every((p) => p.familyId === victim.familyId)).toBe(true);
    const foreign = (await list(main, profiles)) as HealthProfile[];
    expect(foreign.map((p) => p.familyId)).toEqual(Array(4).fill(familyId));
    expect(await list(victim.main, listPaths['GET /api/source-documents'])).toEqual([
      expect.objectContaining({ id: victim.documentId }),
    ]);
    const victimIds = [victim.profile.id, victim.documentId, victim.main.accountId, ...own.map((p) => p.id)];
    for (const path of Object.values(listPaths)) {
      const ids = (await list(main, path)).map((item) => item.id);
      expect(ids.filter((id) => victimIds.includes(id))).toEqual([]);
    }
  });

  it('route đồng thuận cũ không chạm dữ liệu: hồ sơ nhóm khác và ID ngẫu nhiên nhận cùng phản hồi', async () => {
    const victim = await victimFixture();
    const { main } = await attackers();
    const uniform: Record<RouteOfKind<'uniform'>, (id: string) => Promise<Response>> = {
      'POST /api/health-profiles/:id/consent': async (id) =>
        t.call(main, 'POST', `${profiles}/${id}/consent`, { confirmedBy: 'guardian' }),
    };
    for (const call of Object.values(uniform)) {
      const [a, b] = await Promise.all([call(victim.profile.id), call(randomUUID())]);
      expect(a.status).toBe(b.status);
      expect(await a.json()).toEqual(await b.json());
    }
  });

  it('TC-016: member bị từ chối 403 ở mọi route dữ liệu sức khỏe dùng phiên', async () => {
    const victim = await victimFixture();
    const member = await t.session(victim.familyId, 'member', 'Thành viên');
    for (const route of MEMBER_BLOCKED_SESSION_ROUTES) {
      const [method, pattern] = route.split(' ') as [string, string];
      const path = pattern.replace(
        ':id',
        pattern.startsWith(documents) ? victim.documentId : victim.profile.id,
      );
      const concrete = path
        .replace(':courseId', victim.courseId)
        .replace(':prescriptionId', victim.prescriptionId);
      const status = (await t.call(member, method, concrete)).status;
      expect({ route, status }).toEqual({ route, status: 403 });
    }
  });
});
