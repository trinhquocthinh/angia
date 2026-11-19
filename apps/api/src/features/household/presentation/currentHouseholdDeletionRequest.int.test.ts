import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const path = '/api/family/deletion-request/current';
describe('SPEC-069: đọc yêu cầu xoá nhà hiện tại', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  async function setup(pending = true) {
    const family = await t.family();
    const owner = await t.session(family);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    let request: { id: string; status: string; executeAt: string } | undefined;
    if (pending) {
      const response = await t.call(owner, 'POST', '/api/family/deletion-request', {
        confirmFamilyName: 'Nhà',
      });
      expect(response.status).toBe(201);
      request = (await response.json()) as NonNullable<typeof request>;
    }
    return { family, owner, request };
  }
  it('TC-932: Chủ hộ đọc lại đúng DTO, GET không cần CSRF', async () => {
    const f = await setup();
    const response = await t.app.request(path, { headers: { cookie: f.owner.cookie } });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(f.request);
    expect((await t.app.request(path)).status).toBe(401);
  });
  it('TC-933: Đồng quản lý và Thành viên bị chặn dù có hay không có yêu cầu', async () => {
    for (const pending of [true, false]) {
      const f = await setup(pending);
      for (const role of ['main', 'member'] as const) {
        const response = await t.call(await t.session(f.family, role), 'GET', path);
        expect(response.status).toBe(403);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
      }
    }
  });
  it('TC-934: yêu cầu đã thu hồi trả ERR_NOT_FOUND', async () => {
    const f = await setup();
    expect(
      (await t.call(f.owner, 'DELETE', '/api/family/deletion-request', { requestId: f.request!.id })).status,
    ).toBe(204);
    const response = await t.call(f.owner, 'GET', path);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
  });
  it('TC-935: Chủ hộ nhà khác không thấy yêu cầu, giống nhà không có yêu cầu', async () => {
    const f = await setup();
    expect((await t.call(f.owner, 'GET', path)).status).toBe(200);
    const other = await setup(false);
    const empty = await setup(false);
    await expectCrossFamilyDenied(
      () => t.call(other.owner, 'GET', path),
      () => t.call(empty.owner, 'GET', path),
    );
  });
});
