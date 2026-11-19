import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const path = (id: string) => `/api/health-profiles/${id}/guardians`;
describe('SPEC-070: người giám hộ hồ sơ trẻ', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  async function setup(birthYear = 2020) {
    const family = await t.family();
    const an = await t.session(family);
    const binh = await t.session(family);
    const response = await t.call(an, 'POST', '/api/health-profiles', {
      displayName: 'Bé',
      birthYear,
      consent: { kind: 'attestation', attestation: true, basis: 'guardian', respondentName: 'An' },
    });
    expect(response.status).toBe(201);
    const { id } = (await response.json()) as { id: string };
    return { family, an, binh, id };
  }
  async function guardians(id: string) {
    return (
      await t.owner.query(
        'SELECT account_id FROM profile_guardians WHERE health_profile_id=$1 ORDER BY account_id',
        [id],
      )
    ).rows.map((r) => r.account_id as string);
  }
  it('TC-809: tạo hồ sơ trẻ tự gán người tạo; đọc người nhận nhắc từ giám hộ', async () => {
    const f = await setup();
    expect(await guardians(f.id)).toEqual([f.an.accountId]);
    const r = await t.call(f.an, 'GET', `/api/health-profiles/${f.id}/reminder-recipients`);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ recipients: [{ accountId: f.an.accountId }] });
  });
  it('TC-810: thêm người thứ hai, chặn người thứ ba và người trùng; audit không có sức khỏe', async () => {
    const f = await setup();
    const r = await t.call(f.an, 'POST', path(f.id), { guardianAccountId: f.binh.accountId });
    expect(r.status).toBe(204);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(await guardians(f.id)).toEqual([f.an.accountId, f.binh.accountId].sort());
    for (const account of [f.binh, await t.session(f.family)])
      expect((await t.call(f.an, 'POST', path(f.id), { guardianAccountId: account.accountId })).status).toBe(
        422,
      );
    expect(
      (
        await t.owner.query(
          'SELECT action,metadata FROM admin_audit_events WHERE target_profile_id=$1 ORDER BY occurred_at',
          [f.id],
        )
      ).rows,
    ).toEqual([
      { action: 'guardian_added', metadata: {} },
      { action: 'guardian_added', metadata: {} },
    ]);
  });
  it('TC-811/812: chỉ tự gỡ; chặn người duy nhất và cập nhật người nhận ngay', async () => {
    const f = await setup();
    expect((await t.call(f.an, 'POST', path(f.id), { guardianAccountId: f.binh.accountId })).status).toBe(
      204,
    );
    expect((await t.call(f.binh, 'DELETE', `${path(f.id)}/me`)).status).toBe(204);
    expect(await guardians(f.id)).toEqual([f.an.accountId]);
    const r = await t.call(f.an, 'DELETE', `${path(f.id)}/me`);
    expect(r.status).toBe(409);
    expect(await r.json()).toMatchObject({ error: { code: 'ERR_LAST_GUARDIAN' } });
    expect((await t.call(f.binh, 'DELETE', `${path(f.id)}/me`)).status).toBe(403);
  });
  it('TC-813/814: chặn member, main không phải giám hộ và hồ sơ người lớn', async () => {
    const f = await setup();
    const member = await t.session(f.family, 'member');
    expect((await t.call(f.an, 'POST', path(f.id), { guardianAccountId: member.accountId })).status).toBe(
      422,
    );
    expect((await t.call(member, 'POST', path(f.id), { guardianAccountId: f.binh.accountId })).status).toBe(
      403,
    );
    expect((await t.call(f.binh, 'POST', path(f.id), { guardianAccountId: f.binh.accountId })).status).toBe(
      403,
    );
    const adult = await setup(1980);
    expect(
      (await t.call(adult.an, 'POST', path(adult.id), { guardianAccountId: adult.binh.accountId })).status,
    ).toBe(422);
  });
  it('TC-809: không cho chỉ định người nhận riêng dù là main cùng nhà', async () => {
    const f = await setup();
    const r = await t.call(f.an, 'PUT', `/api/health-profiles/${f.id}/reminder-recipients`, {
      recipientAccountIds: [f.binh.accountId],
    });
    expect(r.status).toBe(422);
    expect(
      (await t.owner.query('SELECT * FROM reminder_recipients WHERE health_profile_id=$1', [f.id])).rowCount,
    ).toBe(0);
  });
  it('TC-810/811: chặn truy cập chéo nhà cho cả hai API và tài khoản đích', async () => {
    const a = await setup();
    const b = await setup();
    for (const method of ['POST', 'DELETE']) {
      const suffix = method === 'DELETE' ? '/me' : '';
      const body = method === 'POST' ? { guardianAccountId: a.binh.accountId } : undefined;
      await expectCrossFamilyDenied(
        () => t.call(a.an, method, `${path(b.id)}${suffix}`, body),
        () => t.call(a.an, method, `${path(randomUUID())}${suffix}`, body),
      );
    }
    await expectCrossFamilyDenied(
      () => t.call(a.an, 'POST', path(a.id), { guardianAccountId: b.binh.accountId }),
      () => t.call(a.an, 'POST', path(a.id), { guardianAccountId: randomUUID() }),
    );
  });
  it('TC-810/811: hai lệnh thêm/tự gỡ đồng thời giữ đúng 1–2 giám hộ', async () => {
    const f = await setup();
    const third = await t.session(f.family);
    const added = await Promise.all(
      [f.binh, third].map((a) => t.call(f.an, 'POST', path(f.id), { guardianAccountId: a.accountId })),
    );
    expect(added.map((r) => r.status).sort()).toEqual([204, 422]);
    const other = (await guardians(f.id)).find((id) => id !== f.an.accountId)!;
    const removed = await Promise.all(
      [f.an, other === f.binh.accountId ? f.binh : third].map((a) => t.call(a, 'DELETE', `${path(f.id)}/me`)),
    );
    expect(removed.map((r) => r.status).sort()).toEqual([204, 409]);
    expect(await guardians(f.id)).toHaveLength(1);
  });
  it('TC-810/811: lỗi ghi audit rollback thêm và tự gỡ', async () => {
    const f = await setup();
    await t.owner.query(`CREATE FUNCTION reject_guardian_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action IN ('guardian_added','guardian_removed') THEN RAISE EXCEPTION 'Lỗi thử rollback'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_guardian_audit BEFORE INSERT ON admin_audit_events FOR EACH ROW EXECUTE FUNCTION reject_guardian_audit()`);
    try {
      expect((await t.call(f.an, 'POST', path(f.id), { guardianAccountId: f.binh.accountId })).status).toBe(
        500,
      );
      expect(await guardians(f.id)).toEqual([f.an.accountId]);
      await t.owner.query(
        'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
        [f.id, f.family, f.binh.accountId],
      );
      expect((await t.call(f.binh, 'DELETE', `${path(f.id)}/me`)).status).toBe(500);
      expect(await guardians(f.id)).toEqual([f.an.accountId, f.binh.accountId].sort());
      expect(
        (await t.call(f.an, 'POST', '/api/health-profiles', { displayName: 'Rollback', birthYear: 2020 }))
          .status,
      ).toBe(500);
      expect(
        (
          await t.owner.query(
            "SELECT id FROM health_profiles WHERE family_id=$1 AND display_name='Rollback'",
            [f.family],
          )
        ).rowCount,
      ).toBe(0);
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_guardian_audit ON admin_audit_events; DROP FUNCTION reject_guardian_audit()',
      );
    }
  });
  it('TC-810: body strict, UUID hợp lệ, phiên và CSRF bắt buộc', async () => {
    const f = await setup();
    expect(
      (await t.call(f.an, 'POST', path(f.id), { guardianAccountId: f.binh.accountId, extra: true })).status,
    ).toBe(422);
    expect(
      (await t.call(f.an, 'POST', path('invalid'), { guardianAccountId: f.binh.accountId })).status,
    ).toBe(422);
    expect((await t.app.request(path(f.id), { method: 'POST' })).status).toBe(401);
    for (const method of ['POST', 'DELETE'])
      expect(
        (
          await t.app.request(`${path(f.id)}${method === 'DELETE' ? '/me' : ''}`, {
            method,
            headers: { cookie: f.an.cookie },
          })
        ).status,
      ).toBe(403);
  });
});
