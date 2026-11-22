import { seedIsolationHousehold } from './seedIsolationHousehold.js';
import { createHealthDataProbes } from './createHealthDataProbes.js';
import { seedPainJournal } from './seedPainJournal.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { expectCrossFamilyDenied } from './expectCrossFamilyDenied.js';
import { MEMBER_BLOCKED_SESSION_ROUTES, type RouteOfKind } from './healthDataRoutes.js';
import type { SeededSession } from './seedAuthFixtures.js';
import type { Target } from './CrossFamilyTarget.js';
import { snapshotHealthTables } from './snapshotHealthTables.js';
import { startProfileTestApp, type ProfileTestApp } from './startProfileTestApp.js';

const profiles = '/api/health-profiles';
const documents = '/api/source-documents';

describe('NFR-4: mọi route dữ liệu sức khỏe chặn truy cập chéo gia đình (E2-S7-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const probes = () => createHealthDataProbes(t);

  const victimFixture = () => seedIsolationHousehold(t);
  const attackers = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const adminMain = await t.session(familyId, 'main', 'Quản trị kiêm main', true);
    return { familyId, main, adminMain };
  };

  it('TC-013, TC-014, TC-015, TC-076: main và Quản trị kiêm main nhóm khác nhận đúng phản hồi của ID không tồn tại, không ghi gì', async () => {
    const victim = await victimFixture();
    const { familyId, main, adminMain } = await attackers();
    const { documentId, courseId, prescriptionId, reminderId, revisitReminderId, readingId } = victim;
    const pain = await seedPainJournal(t, victim.main, victim.profile.id);
    const exportId = randomUUID();
    await t.owner.query(
      `INSERT INTO data_exports(id,account_id,status,object_key,expires_at)
       VALUES($1,$2,'ready',$3,now()+interval '24 hours')`,
      [exportId, victim.main.accountId, `exports/${exportId}.zip`],
    );
    const target: Target = {
      exportId,
      ...pain,
      ...{ documentId, courseId, prescriptionId, reminderId, revisitReminderId, readingId },
      profileId: victim.profile.id,
      accountId: victim.main.accountId,
      asNeededCourseId: victim.asNeeded.courseId,
      doseId: victim.asNeeded.doseId,
      token: t.codec.issue({ ...t.codec.verify(victim.token)!, familyId }),
    };
    const ids = Object.keys(target).filter((key) => key !== 'token');
    const missing = {
      ...Object.fromEntries(ids.map((key) => [key, randomUUID()])),
      token: 'bogus',
    } as Target;
    const before = await snapshotHealthTables(t.owner);
    for (const user of [main, adminMain]) {
      for (const [route, probe] of Object.entries(probes())) {
        await expectCrossFamilyDenied(
          () => probe(user, target),
          () => probe(user, missing),
        ).catch((error: Error) => {
          throw new Error(`${route}: ${error.message}`);
        });
      }
    }
    // Hồ sơ "Lén" không được tạo; dữ liệu nạn nhân (gồm link liên kết, chứng từ, số đo) giữ nguyên.
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
  });

  it('TC-017: danh sách chỉ gồm dữ liệu gia đình của phiên, không lẫn nhóm khác', async () => {
    const victim = await victimFixture();
    for (const name of ['Ba', 'Bà'])
      await t.call(victim.main, 'POST', profiles, { birthYear: 1950, displayName: name });
    const { familyId, main } = await attackers();
    for (const name of ['A', 'B', 'C', 'D'])
      await t.call(main, 'POST', profiles, { birthYear: 1950, displayName: name });
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
