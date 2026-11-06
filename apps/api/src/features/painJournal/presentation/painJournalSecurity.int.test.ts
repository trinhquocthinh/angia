import { selfPainJournalRouteProbes } from '@src/shared/test/selfPainJournalRouteProbes.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { expectSelfWriteDenied } from '@src/shared/test/expectSelfWriteDenied.js';
import { HEALTH_DATA_ROUTES, type RouteOfKind } from '@src/shared/test/healthDataRoutes.js';
import { snapshotHealthTables } from '@src/shared/test/snapshotHealthTables.js';
import { painJournalOperations } from '@src/shared/test/painJournalOperations.js';
import {
  painJournalHttpFixture,
  painPath,
  type PainHttpFixture,
  type PainHttpTarget,
} from './painJournalHttpFixture.js';

const selfBase = '/api/me/profile/pain-issues';
describe('Bảo mật HTTP sổ đau nhức', () => {
  let t: PainHttpFixture;
  beforeAll(async () => {
    t = await painJournalHttpFixture();
  });
  afterAll(async () => t?.stop());

  it('TC-709, TC-698/699: mọi route main chặn gia đình khác và mọi self_write chặn hai đích, DB không đổi', async () => {
    const own = await t.profile();
    const sibling = await t.profile(own.familyId);
    const foreign = await t.profile();
    const [sameTarget, foreignTarget] = await Promise.all([t.issue(sibling), t.issue(foreign)]);
    const missing: PainHttpTarget = {
      profileId: randomUUID(),
      issueId: randomUUID(),
      entryId: randomUUID(),
      exerciseId: randomUUID(),
    };
    const before = await snapshotHealthTables(t.owner);
    for (const [method, suffix, body] of painJournalOperations) {
      const mainCall = (x: PainHttpTarget) =>
        t.call(
          own.main,
          method,
          painPath(`/api/health-profiles/${x.profileId}/pain-issues`, suffix, x),
          body,
        );
      await expectCrossFamilyDenied(
        () => mainCall(foreignTarget),
        () => mainCall(missing),
      );
    }
    const probes = selfPainJournalRouteProbes((method, suffix, body) => {
      const call = (x: PainHttpTarget) =>
        t.call(
          own.member,
          method,
          painPath(selfBase, suffix, x),
          suffix === '' ? { ...(body as object), profileId: x.profileId } : body,
        );
      return {
        sameFamilyOtherProfile: () => call(sameTarget),
        otherFamily: () => call(foreignTarget),
        snapshot: () => snapshotHealthTables(t.owner),
      };
    });
    expect(Object.keys(probes).sort()).toEqual(
      Object.entries(HEALTH_DATA_ROUTES)
        .filter(([, kind]) => kind === 'self_write')
        .map(([key]) => key)
        .sort(),
    );
    for (const route of Object.keys(probes) as RouteOfKind<'self_write'>[])
      await expectSelfWriteDenied(route, probes[route]);
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
  });

  it('TC-735: mọi mutation hai cửa thiếu/sai CSRF bị 403, DB không đổi; mọi phản hồi no-store', async () => {
    const own = await t.profile();
    const target = await t.issue(own);
    for (const [base, user] of [
      [`/api/health-profiles/${own.profileId}/pain-issues`, own.main],
      [selfBase, own.member],
    ] as const) {
      for (const [method, suffix, body] of painJournalOperations) {
        const path = painPath(base, suffix, target);
        const before = await snapshotHealthTables(t.owner);
        const missingSession = await t.app.request(path, { method });
        expect(missingSession.status).toBe(401);
        expect(missingSession.headers.get('cache-control')).toBe('no-store');
        if (method === 'GET') {
          const read = await t.call(user, method, path);
          expect(read.status).toBe(200);
          expect(read.headers.get('cache-control')).toBe('no-store');
        } else
          for (const token of [undefined, 'sai-token']) {
            const response = await t.app.request(path, {
              method,
              headers: {
                cookie: user.cookie,
                'content-type': 'application/json',
                ...(token ? { 'x-csrf-token': token } : {}),
              },
              ...(body ? { body: JSON.stringify(body) } : {}),
            });
            expect(response.status, `${method} ${path}`).toBe(403);
            expect(response.headers.get('cache-control')).toBe('no-store');
          }
        expect(await snapshotHealthTables(t.owner)).toEqual(before);
      }
    }
  });
});
