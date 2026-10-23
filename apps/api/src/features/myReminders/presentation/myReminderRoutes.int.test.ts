import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { SEEDED_MEDICATIONS, seedReminder } from '@src/shared/test/seedReminder.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const medications = SEEDED_MEDICATIONS.map(({ courseId: _courseId, ...rest }) => rest);

describe('API lời nhắc cá nhân GET /api/me/reminders/:reminderId (SPEC-035)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const path = (id: string) => `/api/me/reminders/${id}`;
  const fixture = async () => {
    const familyId = await t.family();
    const dad = await t.session(familyId, 'main', 'Bố');
    const mom = await t.session(familyId, 'main', 'Mẹ');
    const grandma = await t.session(familyId, 'member', 'Bà');
    const uncle = await t.session(familyId, 'member', 'Chú');
    const create = async (body: object, recipient?: string) => {
      const profile = (await (
        await t.call(dad, 'POST', '/api/health-profiles', body)
      ).json()) as HealthProfile;
      await acceptConsentInvitation(t, dad, profile.id);
      return { profile, reminderId: await seedReminder(t.owner, familyId, profile.id, recipient) };
    };
    const linked = await create({ displayName: 'Bà Tư', linkedAccountId: grandma.accountId });
    const child = await create({ displayName: 'Bé An' }, dad.accountId);
    return { familyId, dad, mom, grandma, uncle, linked, child };
  };
  const expected = (id: string, profileName: string) => ({
    id,
    date: '2026-10-23',
    slot: 'morning',
    scheduledAt: '2026-10-23T00:00:00.000Z',
    profileName,
    medications,
  });

  it('TC-344: member đọc được lời nhắc hồ sơ liên kết của mình, member khác cùng gia đình nhận 404', async () => {
    const f = await fixture();
    const own = await t.call(f.grandma, 'GET', path(f.linked.reminderId));
    expect(own.status).toBe(200);
    expect(own.headers.get('cache-control')).toBe('no-store');
    expect(await own.json()).toEqual(expected(f.linked.reminderId, 'Bà Tư'));
    await expectCrossFamilyDenied(
      () => t.call(f.uncle, 'GET', path(f.linked.reminderId)),
      () => t.call(f.uncle, 'GET', path(randomUUID())),
    );
    const notFound = await t.call(f.uncle, 'GET', path(f.linked.reminderId));
    expect(notFound.headers.get('cache-control')).toBe('no-store');
  });
  it('TC-344: lời nhắc gia đình khác và reminderId sai định dạng giống ID không tồn tại', async () => {
    const f = await fixture();
    const foreign = await t.session(await t.family(), 'main', 'Lạ');
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'GET', path(f.child.reminderId)),
      () => t.call(foreign, 'GET', path(randomUUID())),
    );
    await expectCrossFamilyDenied(
      () => t.call(f.grandma, 'GET', path('not-a-uuid')),
      () => t.call(f.grandma, 'GET', path(randomUUID())),
    );
  });
  it('TC-344: member vẫn bị chặn ở API thuốc hiện dùng của hồ sơ', async () => {
    const f = await fixture();
    const route = `/api/health-profiles/${f.linked.profile.id}/medication-courses/current`;
    expect((await t.call(f.grandma, 'GET', route)).status).toBe(403);
  });
  it('TC-345: main được chỉ định đọc được lời nhắc với no-store; gỡ chỉ định thì 404', async () => {
    const f = await fixture();
    const response = await t.call(f.dad, 'GET', path(f.child.reminderId));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(expected(f.child.reminderId, 'Bé An'));
    expect((await t.call(f.mom, 'GET', path(f.child.reminderId))).status).toBe(404);
    await t.owner.query('DELETE FROM reminder_recipients WHERE health_profile_id=$1', [f.child.profile.id]);
    expect((await t.call(f.dad, 'GET', path(f.child.reminderId))).status).toBe(404);
  });
  it('TC-345: hồ sơ được liên kết với member thì main từng được chỉ định nhận 404, member nhận 200', async () => {
    const f = await fixture();
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [
      f.child.profile.id,
      f.uncle.accountId,
    ]);
    expect((await t.call(f.dad, 'GET', path(f.child.reminderId))).status).toBe(404);
    expect((await t.call(f.uncle, 'GET', path(f.child.reminderId))).status).toBe(200);
  });
  it('TC-345: hồ sơ hết đồng thuận thì người nhận nhận 404', async () => {
    const f = await fixture();
    await t.owner.query(
      `UPDATE health_profiles SET consent_status='pending', consent_source=NULL, consent_confirmed_at=NULL,
       consent_basis=NULL, consent_respondent_name=NULL WHERE id=$1`,
      [f.linked.profile.id],
    );
    expect((await t.call(f.grandma, 'GET', path(f.linked.reminderId))).status).toBe(404);
  });
  it('TC-345: tài khoản chưa có gia đình nhận 403 ERR_FORBIDDEN, không phiên nhận 401', async () => {
    const f = await fixture();
    const waiting = await seedSession(t.owner, await seedAccount(t.owner));
    const response = await t.call(waiting, 'GET', path(f.child.reminderId));
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    expect((await t.app.request(path(f.child.reminderId))).status).toBe(401);
  });
});
