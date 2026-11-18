import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

type Issued = { invitationId: string; code: string; link: string };
describe('TC-773: hai lời mời hiện tại theo vai trò', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-773: lấy riêng hai mã của người tạo, giữ mã/hạn sau đọc lại, không lộ mã người khác', async () => {
    const family = await t.family();
    const user = await t.session(family);
    const issued: Issued[] = [];
    for (const role of ['member', 'main'])
      issued.push(
        (await (
          await t.call(user, 'POST', '/api/family/invitations', { kind: 'join_family', role })
        ).json()) as Issued,
      );
    const response = await t.call(user, 'GET', '/api/family/invitations/current');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const value = (await response.json()) as { items: Issued[] };
    expect(value.items).toHaveLength(2);
    for (const item of issued) expect(value.items).toContainEqual(expect.objectContaining(item));
    expect(await (await t.call(user, 'GET', '/api/family/invitations/current')).json()).toEqual(value);
    const other = await t.session(family);
    expect(await (await t.call(other, 'GET', '/api/family/invitations/current')).json()).toEqual({
      items: [],
    });
    expect(
      (await t.call(await t.session(family, 'member'), 'GET', '/api/family/invitations/current')).status,
    ).toBe(403);
  });
  it('TC-777: mở lại mã hết hạn có mã để gạch ngang, không trả link; đã thu hồi không trả bí mật', async () => {
    const user = await t.session(await t.family());
    const first = (await (
      await t.call(user, 'POST', '/api/family/invitations', { kind: 'join_family', role: 'member' })
    ).json()) as Issued;
    await t.owner.query(
      "UPDATE family_invitations SET created_at=now()-interval '8 days',expires_at=now()-interval '1 day' WHERE id=$1",
      [first.invitationId],
    );
    const expired = (await (await t.call(user, 'GET', '/api/family/invitations/current')).json()) as {
      items: unknown[];
    };
    expect(expired.items[0]).toMatchObject({ status: 'expired', code: first.code, link: null });
    const next = (await (
      await t.call(user, 'POST', '/api/family/invitations', { kind: 'join_family', role: 'member' })
    ).json()) as Issued;
    await t.call(user, 'DELETE', `/api/family/invitations/${next.invitationId}`);
    const revoked = (await (await t.call(user, 'GET', '/api/family/invitations/current')).json()) as {
      items: unknown[];
    };
    expect(revoked.items).toHaveLength(1);
    expect(revoked.items[0]).toMatchObject({
      invitationId: next.invitationId,
      status: 'revoked',
      code: null,
      link: null,
    });
  });
});
