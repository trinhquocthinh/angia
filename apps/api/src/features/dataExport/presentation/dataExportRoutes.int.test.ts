import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const path = '/api/me/data-exports';
describe('SPEC-072 route tải dữ liệu qua PostgreSQL và phiên thật', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const ready = async (accountId: string, expiresAt: Date, key?: string) => {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO data_exports(id,account_id,status,object_key,expires_at,created_at)
      VALUES($1,$2,'ready',$3,$4,'2026-11-22T12:00:00Z')`,
      [id, accountId, key ?? `exports/${id}.zip`, expiresAt],
    );
    return id;
  };
  const request = (user: Parameters<ProfileTestApp['call']>[0], scope: unknown = 'self') =>
    t.call(user, 'POST', path, { scope });
  const profile = async (familyId: string) => {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO health_profiles(id,family_id,display_name,birth_year)
      VALUES($1,$2,'Bé',2020)`,
      [id, familyId],
    );
    return id;
  };
  it('TC-825 link quá 24 giờ trả cùng 404 cho tệp và trạng thái', async () => {
    const user = await t.session(await t.family());
    const id = await ready(user.accountId, new Date(Date.now() - 1));
    for (const suffix of ['', '/file']) {
      const response = await t.call(user, 'GET', `${path}/${id}${suffix}`);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  });
  it('TC-826 export nhà khác và ID ngẫu nhiên không phân biệt qua status/file', async () => {
    const owner = await t.session(await t.family());
    const attacker = await t.session(await t.family());
    const id = await ready(owner.accountId, new Date(Date.now() + 86400000));
    for (const suffix of ['', '/file'])
      await expectCrossFamilyDenied(
        () => t.call(attacker, 'GET', `${path}/${id}${suffix}`),
        () => t.call(attacker, 'GET', `${path}/${randomUUID()}${suffix}`),
      );
  });
  it('TC-823 self không có nhà, chưa nhận văn bản mới vẫn tạo một dòng và một job', async () => {
    const user = await seedSession(t.owner, await seedAccount(t.owner, { legalAccepted: false }));
    const response = await request(user);
    expect(response.status).toBe(202);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const { exportId } = (await response.json()) as { exportId: string };
    const { rows } = await t.owner.query('SELECT status,profile_id FROM data_exports WHERE id=$1', [
      exportId,
    ]);
    expect(rows).toEqual([{ status: 'pending', profile_id: null }]);
    const jobs = await t.owner.query(
      `SELECT data FROM pgboss.job WHERE name='build-data-export' AND data->>'exportId'=$1`,
      [exportId],
    );
    expect(jobs.rows).toEqual([{ data: { exportId } }]);
    const status = await t.call(user, 'GET', `${path}/${exportId}`);
    expect(status.status).toBe(200);
    expect(await status.json()).toEqual({ status: 'pending', expiresAt: null });
  });
  it('TC-826 profile nhà khác giống ID ngẫu nhiên; member chỉ được tải self', async () => {
    const family = await t.family();
    const main = await t.session(family);
    const member = await t.session(family, 'member');
    const foreign = await profile(await t.family());
    await expectCrossFamilyDenied(
      () => request(main, { profileId: foreign }),
      () => request(main, { profileId: randomUUID() }),
    );
    const local = await profile(family);
    expect((await request(member, { profileId: local })).status).toBe(404);
    expect((await request(member)).status).toBe(202);
    expect((await request(main, { profileId: local })).status).toBe(202);
  });
  it('TC-826/851 ba lượt xuất đi tiếp, lượt bốn bị chặn và 404 không tiêu hạn mức', async () => {
    const family = await t.family();
    const main = await t.session(family);
    const other = await t.session(family, 'member');
    const id = await profile(family);
    await t.owner.query('UPDATE accounts SET health_profile_id=$2 WHERE id=$1', [other.accountId, id]);
    for (let i = 0; i < 4; i++) expect((await request(main, { profileId: id })).status).toBe(404);
    for (let i = 0; i < 3; i++) expect((await request(main)).status).toBe(202);
    const limited = await request(main);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({ error: { code: 'ERR_RATE_LIMITED' } });
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
  });
  it('TC-826 truyền đúng byte và header; key sai hoặc object mất đều 404', async () => {
    const user = await seedSession(t.owner, await seedAccount(t.owner, { legalAccepted: false }));
    const id = await ready(user.accountId, new Date(Date.now() + 86400000));
    const bytes = new Uint8Array([80, 75, 3, 4, 0, 255]);
    t.objects.set(`exports/${id}.zip`, { body: bytes, contentType: 'application/zip' });
    const response = await t.call(user, 'GET', `${path}/${id}/file`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/zip');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="angia-du-lieu-20261122.zip"',
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    t.objects.delete(`exports/${id}.zip`);
    expect((await t.call(user, 'GET', `${path}/${id}/file`)).status).toBe(404);
    const invalidKey = await ready(user.accountId, new Date(Date.now() + 86400000), 'exports/wrong.zip');
    expect((await t.call(user, 'GET', `${path}/${invalidKey}/file`)).status).toBe(404);
  });
  it('TC-826 body strict từ chối khóa thừa ở cả scope và body', async () => {
    const user = await t.session(await t.family());
    expect((await t.call(user, 'POST', path, { scope: 'self', accountId: randomUUID() })).status).toBe(422);
    expect((await request(user, { profileId: randomUUID(), familyId: randomUUID() })).status).toBe(422);
  });
});
