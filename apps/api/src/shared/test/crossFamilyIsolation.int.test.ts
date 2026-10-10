import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from './acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from './expectCrossFamilyDenied.js';
import { HEALTH_DATA_ROUTES, type RouteOfKind } from './healthDataRoutes.js';
import type { SeededSession } from './seedAuthFixtures.js';
import { seedPendingDocument } from './seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from './startProfileTestApp.js';

// Tài nguyên đích của một request: của gia đình nạn nhân, hoặc toàn ID/token không tồn tại.
interface Target {
  profileId: string;
  documentId: string;
  accountId: string;
  token: string;
}
type Probe = (user: SeededSession, target: Target) => Response | Promise<Response>;

const reading = {
  type: 'device_reading',
  measuredAt: '2026-10-05',
  measuredTime: '07:10',
  kind: 'blood_pressure',
  systolic: 130,
  diastolic: 90,
  pulse: 78,
  glucoseValue: null,
  glucoseUnit: null,
} as const;
const respondBody = { decision: 'accepted', basis: 'self', respondentName: 'Lén' };
const profiles = '/api/health-profiles';
const documents = '/api/source-documents';
const SNAPSHOT_TABLES = [
  'health_profiles',
  'accounts',
  'consent_invitations',
  'upload_batches',
  'source_documents',
  'extractions',
  'measurements',
  'prescriptions',
  'prescription_items',
  'lab_results',
];

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
    return { familyId, main, profile, documentId, token };
  };
  const attackers = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const adminMain = await t.session(familyId, 'main', 'Quản trị kiêm main', true);
    return { familyId, main, adminMain };
  };
  const snapshot = async () => {
    const tables: Record<string, unknown> = {};
    for (const table of SNAPSHOT_TABLES) {
      const sql = `SELECT coalesce(json_agg(x ORDER BY x.id), '[]') AS rows FROM ${table} x`;
      tables[table] = (await t.owner.query(sql)).rows[0].rows;
    }
    return tables;
  };

  it('TC-013, TC-014, TC-015, TC-076: main và Quản trị kiêm main nhóm khác nhận đúng phản hồi của ID không tồn tại, không ghi gì', async () => {
    const victim = await victimFixture();
    const { familyId, main, adminMain } = await attackers();
    const claims = t.codec.verify(victim.token)!;
    const target: Target = {
      profileId: victim.profile.id,
      documentId: victim.documentId,
      accountId: victim.main.accountId,
      token: t.codec.issue({ ...claims, familyId }),
    };
    const missing: Target = {
      profileId: randomUUID(),
      documentId: randomUUID(),
      accountId: randomUUID(),
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
    const sessionRoutes = Object.keys(HEALTH_DATA_ROUTES).filter((r) => !r.includes('/consent-invitations/'));
    for (const route of sessionRoutes) {
      const [method, pattern] = route.split(' ') as [string, string];
      const path = pattern.replace(
        ':id',
        pattern.startsWith(documents) ? victim.documentId : victim.profile.id,
      );
      expect({ route, status: (await t.call(member, method, path)).status }).toEqual({ route, status: 403 });
    }
  });
});
