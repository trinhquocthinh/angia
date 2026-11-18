import { householdInvitationFixture } from '@src/shared/test/householdInvitationFixture.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

type Issued = { invitationId: string; code: string; link: string };
type Listed = { items: { secrets: unknown; status: string }[] };

describe('TC-773: quản lý lời mời sau khi rời trang', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const issue = (user: Parameters<ProfileTestApp['call']>[0]) =>
    t.call(user, 'POST', '/api/family/invitations', { kind: 'join_family', role: 'member' });

  it('TC-773: tải lại danh sách lấy đúng mã; tạo lặp/đồng thời không sinh thêm hoặc gia hạn', async () => {
    const user = await t.session(await t.family());
    const first = (await (await issue(user)).json()) as Issued;
    const repeats = await Promise.all([issue(user), issue(user)]);
    for (const response of repeats) expect(await response.json()).toEqual(first);
    expect(
      (await t.owner.query('SELECT id FROM family_invitations WHERE created_by=$1', [user.accountId])).rows,
    ).toHaveLength(1);
    expect(
      (
        await t.owner.query(
          "SELECT id FROM admin_audit_events WHERE actor_account_id=$1 AND action='invitation_created'",
          [user.accountId],
        )
      ).rows,
    ).toHaveLength(1);
    const list = await t.call(user, 'GET', '/api/family/invitations');
    expect(list.status).toBe(200);
    expect(list.headers.get('cache-control')).toBe('no-store');
    expect(await list.json()).toMatchObject({
      items: [
        {
          invitationId: first.invitationId,
          status: 'active',
          secrets: { code: first.code, link: first.link },
        },
      ],
      hasMore: false,
    });
    const stored = await t.owner.query('SELECT secret_ciphertext FROM family_invitations WHERE id=$1', [
      first.invitationId,
    ]);
    expect(stored.rows[0].secret_ciphertext).not.toContain(first.code);
  });

  it('TC-773: legacy vẫn liệt kê, chặn tạo trùng và thay mã thu hồi mã cũ', async () => {
    const user = await t.session(await t.family());
    const first = (await (await issue(user)).json()) as Issued;
    await t.owner.query('UPDATE family_invitations SET secret_ciphertext=NULL WHERE id=$1', [
      first.invitationId,
    ]);
    const list = (await (await t.call(user, 'GET', '/api/family/invitations')).json()) as Listed;
    expect(list.items[0]).toMatchObject({ secrets: null, status: 'active' });
    expect((await issue(user)).status).toBe(409);
    const replacement = await t.call(
      user,
      'POST',
      `/api/family/invitations/${first.invitationId}/replace`,
      {},
    );
    expect(replacement.status).toBe(201);
    expect(((await replacement.json()) as Issued).invitationId).not.toBe(first.invitationId);
    expect(
      (await t.owner.query('SELECT revoked_at FROM family_invitations WHERE id=$1', [first.invitationId]))
        .rows[0].revoked_at,
    ).not.toBeNull();
  });

  it('TC-774: không lộ bí mật người khác hoặc lời mời nhà khác', async () => {
    const family = await t.family();
    const creator = await t.session(family);
    const first = (await (await issue(creator)).json()) as Issued;
    const manager = await t.session(family);
    const list = (await (await t.call(manager, 'GET', '/api/family/invitations')).json()) as Listed;
    expect(list.items[0]!.secrets).toBeNull();
    const other = await t.session(await t.family());
    expect(await (await t.call(other, 'GET', '/api/family/invitations')).json()).toEqual({
      items: [],
      hasMore: false,
    });
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', `/api/family/invitations/${first.invitationId}/replace`, {}),
      () => t.call(other, 'POST', '/api/family/invitations/11111111-1111-4111-8111-111111111111/replace', {}),
    );
    expect((await t.call(await t.session(family, 'member'), 'GET', '/api/family/invitations')).status).toBe(
      403,
    );
  });
  it('TC-773: thay đồng thời chỉ một mã mới, lỗi INSERT rollback cả thu hồi', async () => {
    const user = await t.session(await t.family());
    const first = (await (await issue(user)).json()) as Issued;
    const responses = await Promise.all(
      [1, 2].map(() => t.call(user, 'POST', `/api/family/invitations/${first.invitationId}/replace`, {})),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([201, 404]);
    const current = (await await responses.find((r) => r.status === 201)!.json()) as Issued;
    await t.owner.query(
      `CREATE FUNCTION reject_invitation_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Lỗi ghi thử'; END $$`,
    );
    await t.owner.query(
      'CREATE TRIGGER reject_invitation_test BEFORE INSERT ON family_invitations FOR EACH ROW EXECUTE FUNCTION reject_invitation_test()',
    );
    try {
      expect(
        (await t.call(user, 'POST', `/api/family/invitations/${current.invitationId}/replace`, {})).status,
      ).toBe(500);
      expect(
        (await t.owner.query('SELECT revoked_at FROM family_invitations WHERE id=$1', [current.invitationId]))
          .rows[0].revoked_at,
      ).toBeNull();
    } finally {
      await t.owner.query('DROP TRIGGER reject_invitation_test ON family_invitations');
      await t.owner.query('DROP FUNCTION reject_invitation_test()');
    }
  });
  it('TC-773: phân trang không bỏ lời mời cũ, tham số âm bị chặn', async () => {
    const family = await t.family();
    const user = await t.session(family);
    await t.owner.query(
      `INSERT INTO family_invitations(id,kind,family_id,role,token_hash,code_hash,created_by,expires_at)
      SELECT gen_random_uuid(),'join_family',$1,'member',gen_random_uuid()::text,gen_random_uuid()::text,$2,now()+interval '7 days' FROM generate_series(1,51)`,
      [family, user.accountId],
    );
    const first = (await (await t.call(user, 'GET', '/api/family/invitations')).json()) as {
      items: unknown[];
      hasMore: boolean;
    };
    const second = (await (await t.call(user, 'GET', '/api/family/invitations?offset=50')).json()) as {
      items: unknown[];
      hasMore: boolean;
    };
    expect(first.items).toHaveLength(50);
    expect(first.hasMore).toBe(true);
    expect(second.items).toHaveLength(1);
    expect(second.hasMore).toBe(false);
    expect((await t.call(user, 'GET', '/api/family/invitations?offset=-1')).status).toBe(422);
  });

  it('TC-775: thay mã vô hiệu mã cũ; mã mới dùng một lần, danh sách đã dùng không lộ bí mật', async () => {
    const fixture = householdInvitationFixture(t);
    const first = await fixture.issue();
    const response = await t.call(
      first.creator,
      'POST',
      `/api/family/invitations/${first.invitationId}/replace`,
      {},
    );
    const next = (await response.json()) as Issued;
    const receiver = await fixture.waiting();
    expect((await fixture.accept(receiver, first.code)).status).toBe(404);
    expect((await fixture.accept(receiver, next.code)).status).toBe(204);
    const list = (await (await t.call(first.creator, 'GET', '/api/family/invitations')).json()) as {
      items: { invitationId: string; status: string; secrets: unknown }[];
    };
    expect(list.items.find((item) => item.invitationId === next.invitationId)).toMatchObject({
      status: 'accepted',
      secrets: null,
    });
    expect(list.items.find((item) => item.invitationId === first.invitationId)).toMatchObject({
      status: 'revoked',
      secrets: null,
    });
  });
});
