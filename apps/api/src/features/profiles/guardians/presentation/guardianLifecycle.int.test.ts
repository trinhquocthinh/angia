import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { linkCall } from '@src/shared/test/profileConsentFixture.js';
import { createProfileRepository } from '../../infrastructure/createProfileRepository.js';

describe('SPEC-070: tương thích vòng đời hồ sơ và khóa transaction', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  async function setup() {
    const family = await t.family();
    const main = await t.session(family);
    const response = await t.call(main, 'POST', '/api/health-profiles', {
      displayName: 'Bé',
      birthYear: 2020,
    });
    expect(response.status).toBe(201);
    const { id } = (await response.json()) as { id: string };
    return { family, main, id };
  }
  it('TC-809: liên kết tài khoản bỏ tư cách giám hộ và ghi đúng actor cùng transaction', async () => {
    const f = await setup();
    const member = await t.session(f.family, 'member');
    const invitation = await t.call(f.main, 'POST', `/api/health-profiles/${f.id}/link-invitations`, {});
    expect(invitation.status).toBe(201);
    const { url } = (await invitation.json()) as { url: string };
    const token = url.split('#token=')[1]!;
    const response = await linkCall(t, member, token, { decision: 'accepted' });
    expect(response.status).toBe(200);
    expect(
      (await t.owner.query('SELECT * FROM profile_guardians WHERE health_profile_id=$1', [f.id])).rowCount,
    ).toBe(0);
    expect(
      (
        await t.owner.query(
          "SELECT actor_account_id,target_account_id FROM admin_audit_events WHERE target_profile_id=$1 AND action='guardian_removed'",
          [f.id],
        )
      ).rows,
    ).toEqual([{ actor_account_id: member.accountId, target_account_id: f.main.accountId }]);
  });
  it('TC-809/814: hồ sơ vừa đủ 18 vẫn sửa lựa chọn số đo mà không cần gửi lại năm sinh', async () => {
    const f = await setup();
    // Mô phỏng dữ liệu giám hộ còn lại sau đổi năm, chỉ trong Testcontainers dùng một lần.
    await t.owner.query('ALTER TABLE health_profiles DISABLE TRIGGER health_profiles_guardians_valid');
    try {
      await t.owner.query('UPDATE health_profiles SET birth_year=1900 WHERE id=$1', [f.id]);
    } finally {
      await t.owner.query('ALTER TABLE health_profiles ENABLE TRIGGER health_profiles_guardians_valid');
    }
    expect(
      (await t.call(f.main, 'PATCH', `/api/health-profiles/${f.id}`, { vitalsEnabled: true })).status,
    ).toBe(200);
    expect(
      (await t.owner.query('SELECT * FROM profile_guardians WHERE health_profile_id=$1', [f.id])).rowCount,
    ).toBe(0);
  });
  it('TC-809: xác nhận đồng thuận sau khi đủ 18 dọn giám hộ cũ cùng transaction', async () => {
    const f = await setup();
    await t.owner.query('ALTER TABLE health_profiles DISABLE TRIGGER health_profiles_guardians_valid');
    try {
      await t.owner.query('UPDATE health_profiles SET birth_year=1900 WHERE id=$1', [f.id]);
    } finally {
      await t.owner.query('ALTER TABLE health_profiles ENABLE TRIGGER health_profiles_guardians_valid');
    }
    const response = await t.call(f.main, 'POST', `/api/health-profiles/${f.id}/consent-attestation`, {
      kind: 'attestation',
      attestation: true,
      basis: 'self',
      respondentName: 'An',
    });
    expect(response.status).toBe(200);
    expect(
      (await t.owner.query('SELECT * FROM profile_guardians WHERE health_profile_id=$1', [f.id])).rowCount,
    ).toBe(0);
  });
  it('TC-809: chặn đổi năm sinh người lớn thành trẻ nếu chưa có giám hộ', async () => {
    const f = await setup();
    expect((await t.call(f.main, 'PATCH', `/api/health-profiles/${f.id}`, { birthYear: 1980 })).status).toBe(
      200,
    );
    const response = await t.call(f.main, 'PATCH', `/api/health-profiles/${f.id}`, { birthYear: 2020 });
    expect(response.status).toBe(422);
    expect(
      (await t.owner.query('SELECT birth_year FROM health_profiles WHERE id=$1', [f.id])).rows[0].birth_year,
    ).toBe(1980);
  });
  it('TC-809: tự gỡ và admin gỡ liên kết hồ sơ trẻ bị chặn, không đổi liên kết', async () => {
    const f = await setup();
    const response = await t.call(f.main, 'POST', '/api/health-profiles', {
      displayName: 'Tôi',
      birthYear: 2020,
      linkedAccountId: f.main.accountId,
      consent: { kind: 'self' },
    });
    expect(response.status).toBe(201);
    const { id } = (await response.json()) as { id: string };
    expect((await t.call(f.main, 'POST', '/api/me/profile-link/unlink', { confirm: true })).status).toBe(422);
    const admin = await t.session(f.family, 'main', 'Quản trị', true);
    expect(
      (
        await t.call(admin, 'PUT', `/api/admin/families/${f.family}/profiles/${id}/linked-account`, {
          accountId: null,
        })
      ).status,
    ).toBe(422);
    expect(
      (await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [f.main.accountId])).rows[0]
        .health_profile_id,
    ).toBe(id);
  });
  it('TC-809: gỡ thành viên và rời nhà giữ hồ sơ trẻ bị chặn; xoá hồ sơ khi rời vẫn được', async () => {
    const family = await t.family();
    const owner = await t.session(family);
    const target = await t.session(family);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    const response = await t.call(target, 'POST', '/api/health-profiles', {
      displayName: 'Tôi',
      birthYear: 2020,
      linkedAccountId: target.accountId,
      consent: { kind: 'self' },
    });
    expect(response.status).toBe(201);
    const { id } = (await response.json()) as { id: string };
    expect(
      (await t.call(owner, 'PATCH', `/api/family/members/${target.accountId}`, { action: 'remove' })).status,
    ).toBe(422);
    expect(
      (await t.call(target, 'POST', '/api/family/leave', { ownProfileDisposition: 'keep' })).status,
    ).toBe(422);
    expect(
      (
        await t.owner.query('SELECT family_id,health_profile_id FROM accounts WHERE id=$1', [
          target.accountId,
        ])
      ).rows[0],
    ).toEqual({ family_id: family, health_profile_id: id });
    expect(
      (await t.call(target, 'POST', '/api/family/leave', { ownProfileDisposition: 'delete' })).status,
    ).toBe(204);
    expect((await t.owner.query('SELECT id FROM health_profiles WHERE id=$1', [id])).rowCount).toBe(0);
  });
  it('TC-810: cập nhật hồ sơ giữ khóa không tạo deadlock với thêm giám hộ', async () => {
    const f = await setup();
    const other = await t.session(f.family);
    let ready!: () => void;
    let resume!: () => void;
    const locked = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const updating = createProfileRepository(t.database, t.boss).withFamily(f.family, async (store) => {
      await store.lockProfile(f.id);
      ready();
      await gate;
      await store.updateProfile(f.id, { vitalsEnabled: true });
    });
    await locked;
    const adding = t.call(f.main, 'POST', `/api/health-profiles/${f.id}/guardians`, {
      guardianAccountId: other.accountId,
    });
    try {
      let waiting = false;
      for (let i = 0; i < 200 && !waiting; i++) {
        waiting =
          (
            await t.owner.query(
              "SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'",
            )
          ).rowCount! > 0;
        if (!waiting) await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
    } finally {
      resume();
    }
    await updating;
    expect((await adding).status).toBe(204);
  });
});
