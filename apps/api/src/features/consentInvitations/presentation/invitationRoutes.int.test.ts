import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, ConsentInvitationCreated, ConsentInvitationReceipt } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const base = '/api/health-profiles';
const invitationPath = (id: string) => `${base}/${id}/consent-invitations`;
const responseBody = { decision: 'accepted', basis: 'guardian', respondentName: ' Nguyễn An ' };
const origin = 'http://localhost:5173';

describe('Link đồng thuận: PostgreSQL thật và NOBYPASSRLS', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const publicCall = (token: string, method = 'GET', body?: unknown, callerOrigin: string | null = origin) =>
    t.app.request(`/api/consent-invitations/${method === 'GET' ? 'view' : 'respond'}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...(callerOrigin ? { origin: callerOrigin } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const fixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (await t.call(main, 'POST', base, { displayName: 'Mẹ' })).json()) as HealthProfile;
    const created = await t.call(main, 'POST', invitationPath(profile.id));
    expect(created.status).toBe(201);
    const invitation = (await created.json()) as ConsentInvitationCreated;
    return { familyId, main, profile, ...invitation };
  };

  it('main tạo link 7 ngày; GET không tiêu thụ, không yêu cầu phiên, chỉ lộ tên tối thiểu', async () => {
    const f = await fixture();
    expect(new Date(f.expiresAt).getTime() - Date.now()).toBeGreaterThan(7 * 86400000 - 10000);
    const view = await publicCall(f.token);
    expect(view.status).toBe(200);
    expect(view.headers.get('cache-control')).toBe('no-store');
    expect(view.headers.get('referrer-policy')).toBe('no-referrer');
    expect(await view.json()).toEqual({
      profileDisplayName: 'Mẹ',
      inviterDisplayName: 'Người chăm',
      expiresAt: f.expiresAt,
      status: 'pending',
    });
    expect((await publicCall(f.token)).status).toBe(200);
    expect((await publicCall(f.token, 'POST', responseBody)).status).toBe(200);
    const profile = (await (await t.call(f.main, 'GET', base)).json()) as HealthProfile[];
    expect(profile[0]).toMatchObject({
      consentStatus: 'confirmed',
      consentSource: 'invitation',
      consentConfirmedBy: null,
      consentBasis: 'guardian',
      consentRespondentName: 'Nguyễn An',
    });
    const raw = await t.owner.query(
      'SELECT token_hash, decision FROM consent_invitations WHERE profile_id=$1',
      [f.profile.id],
    );
    expect(raw.rows[0]).toEqual({ token_hash: t.codec.hash(f.token), decision: 'accepted' });
    expect((await t.pool.query('SELECT * FROM consent_invitations')).rowCount).toBe(0);
    expect(
      (await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
  it('TC-010: tạo/thu hồi hồ sơ nhóm khác giống ID không tồn tại; token phạm vi giả không lộ dữ liệu', async () => {
    const f = await fixture();
    const otherFamily = await t.family();
    const other = await t.session(otherFamily);
    for (const method of ['POST', 'DELETE']) {
      await expectCrossFamilyDenied(
        () => t.call(other, method, invitationPath(f.profile.id)),
        () => t.call(other, method, invitationPath(randomUUID())),
      );
    }
    const claims = t.codec.verify(f.token)!;
    const foreignToken = t.codec.issue({ ...claims, familyId: otherFamily });
    await expectCrossFamilyDenied(
      () => publicCall(foreignToken),
      () => publicCall('bogus'),
    );
    await expectCrossFamilyDenied(
      () => publicCall(foreignToken, 'POST', responseBody),
      () => publicCall('bogus', 'POST', responseBody),
    );
  });
  it('hai phản hồi đồng thời chỉ ghi một quyết định, replay giữ metadata đầu', async () => {
    const f = await fixture();
    const responses = await Promise.all([
      publicCall(f.token, 'POST', responseBody),
      publicCall(f.token, 'POST', { decision: 'declined', basis: 'self', respondentName: 'Bình' }),
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    const receipts = await Promise.all(responses.map((r) => r.json() as Promise<ConsentInvitationReceipt>));
    expect(receipts.map((r) => r.outcome).sort()).toEqual(['already_responded', 'recorded']);
    const first = receipts.find((r) => r.outcome === 'recorded')!;
    expect(receipts.find((r) => r.outcome === 'already_responded')).toEqual({
      ...first,
      outcome: 'already_responded',
    });
    expect(await (await publicCall(f.token, 'POST', responseBody)).json()).toEqual({
      ...first,
      outcome: 'already_responded',
    });
  });
  it('rotation, thu hồi, hết hạn và token sửa đổi đều 404; hết hạn vẫn chặn replay', async () => {
    const f = await fixture();
    const rotated = (await (
      await t.call(f.main, 'POST', invitationPath(f.profile.id))
    ).json()) as ConsentInvitationCreated;
    await expectCrossFamilyDenied(
      () => publicCall(f.token),
      () => publicCall('bogus'),
    );
    expect((await publicCall(rotated.token)).status).toBe(200);
    expect((await t.call(f.main, 'DELETE', invitationPath(f.profile.id))).status).toBe(200);
    expect((await publicCall(rotated.token, 'POST', responseBody)).status).toBe(404);
    const fresh = (await (
      await t.call(f.main, 'POST', invitationPath(f.profile.id))
    ).json()) as ConsentInvitationCreated;
    expect((await publicCall(fresh.token, 'POST', { ...responseBody, decision: 'declined' })).status).toBe(
      200,
    );
    await t.owner.query(
      "UPDATE consent_invitations SET expires_at=now()-interval '1 second' WHERE profile_id=$1",
      [f.profile.id],
    );
    expect((await publicCall(fresh.token)).status).toBe(404);
    expect((await publicCall(fresh.token, 'POST', responseBody)).status).toBe(404);
    expect((await publicCall(fresh.token.replace(/^v1./, 'v2.'))).status).toBe(404);
  });
  it('Origin bắt buộc khớp cấu hình, body và tên hợp lệ, ngoại lệ phiên chỉ đúng path', async () => {
    const f = await fixture();
    for (const badOrigin of [null, 'https://attacker.test', 'null', 'http://localhost:5173.attacker.test']) {
      expect((await publicCall(f.token, 'POST', responseBody, badOrigin)).status).toBe(403);
    }
    for (const body of [
      { ...responseBody, respondentName: ' ' },
      { ...responseBody, respondentName: 'a'.repeat(61) },
      { ...responseBody, basis: 'main' },
      { ...responseBody, extra: true },
    ]) {
      expect((await publicCall(f.token, 'POST', body)).status).toBe(422);
    }
    expect((await t.app.request('/api/consent-invitations/view/more')).status).toBe(401);
    expect((await t.app.request('/api/consent-invitations/respond/more', { method: 'POST' })).status).toBe(
      401,
    );
    expect((await t.app.request(invitationPath(f.profile.id), { method: 'POST' })).status).toBe(401);
    const member = await t.session(f.familyId, 'member');
    expect((await t.call(member, 'POST', invitationPath(f.profile.id))).status).toBe(403);
    expect((await t.call(member, 'DELETE', invitationPath(f.profile.id))).status).toBe(403);
    expect(
      (
        await t.app.request(invitationPath(f.profile.id), {
          method: 'POST',
          headers: { cookie: f.main.cookie },
        })
      ).status,
    ).toBe(403);
  });
  it('người mời chuyển gia đình thì tên null, hồ sơ từ chối được mời lại', async () => {
    const f = await fixture();
    const next = await t.family();
    await t.owner.query('UPDATE accounts SET family_id=$1 WHERE id=$2', [next, f.main.accountId]);
    expect(await (await publicCall(f.token)).json()).toMatchObject({ inviterDisplayName: null });
    await publicCall(f.token, 'POST', { ...responseBody, decision: 'declined' });
    const newMain = await t.session(f.familyId);
    const profiles = (await (await t.call(newMain, 'GET', base)).json()) as HealthProfile[];
    expect(profiles[0]?.consentStatus).toBe('declined');
    expect((await t.call(newMain, 'POST', invitationPath(f.profile.id))).status).toBe(201);
  });
  it.each(['POST', 'DELETE'])(
    'acceptance đồng thời với %s giữ profile-first lock và không xóa quyết định',
    async (method) => {
      const f = await fixture();
      const [accepted, managed] = await Promise.all([
        publicCall(f.token, 'POST', responseBody),
        t.call(f.main, method, invitationPath(f.profile.id)),
      ]);
      expect([accepted.status, managed.status]).toSatisfy(
        (statuses: number[]) =>
          (statuses[0] === 200 && statuses[1] === 409) ||
          (statuses[0] === 404 && statuses[1] === (method === 'POST' ? 201 : 200)),
      );
      if (accepted.status === 200) {
        const before = await (await t.call(f.main, 'GET', base)).json();
        for (const action of ['POST', 'DELETE'])
          expect((await t.call(f.main, action, invitationPath(f.profile.id))).status).toBe(409);
        expect(await (await t.call(f.main, 'GET', base)).json()).toEqual(before);
      }
    },
  );
  it('FK composite và response complete chặn ghi sai, RLS chặn truy cập nhóm khác', async () => {
    const f = await fixture();
    const other = await t.family();
    await expect(
      t.owner.query(
        'INSERT INTO consent_invitations(id,family_id,profile_id,token_hash,expires_at) VALUES($1,$2,$3,$4,now())',
        [randomUUID(), other, f.profile.id, 'foreign'],
      ),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      t.owner.query("UPDATE consent_invitations SET decision='accepted' WHERE profile_id=$1", [f.profile.id]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      t.owner.query("UPDATE health_profiles SET consent_status='confirmed' WHERE id=$1", [f.profile.id]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      t.owner.query(
        "UPDATE health_profiles SET consent_status='confirmed', consent_confirmed_at=now(), consent_basis='self', consent_respondent_name='An', consent_source=NULL WHERE id=$1",
        [f.profile.id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    const client = await t.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.family_id', $1, true)", [other]);
      expect(
        (await client.query('SELECT * FROM consent_invitations WHERE profile_id=$1', [f.profile.id]))
          .rowCount,
      ).toBe(0);
      expect(
        (
          await client.query('UPDATE consent_invitations SET revoked_at=now() WHERE profile_id=$1', [
            f.profile.id,
          ])
        ).rowCount,
      ).toBe(0);
      await expect(
        client.query(
          'INSERT INTO consent_invitations(id,family_id,profile_id,token_hash,expires_at) VALUES($1,$2,$3,$4,now())',
          [randomUUID(), f.familyId, f.profile.id, 'rls-wrong'],
        ),
      ).rejects.toMatchObject({ code: '42501' });
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
