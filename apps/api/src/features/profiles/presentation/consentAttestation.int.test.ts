import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import {
  ATTESTATION,
  attestationPath,
  invitationCall,
  profileConsentFixture,
} from '@src/shared/test/profileConsentFixture.js';

describe('LG-02: xác nhận hồ sơ hiện có', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it.each(['pending', 'invited', 'declined'] as const)(
    'TC-551: %s chuyển confirmed, link đang chờ bị thu hồi',
    async (status) => {
      const f = await profileConsentFixture(t);
      const profile = await f.create();
      const link = status === 'pending' ? null : await f.invite(profile.id);
      if (status === 'declined')
        await invitationCall(t, link!.token, { decision: 'declined', basis: 'self', respondentName: 'An' });
      const response = await t.call(f.main, 'POST', attestationPath(profile.id), ATTESTATION);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toMatchObject({
        consentStatus: 'confirmed',
        consentSource: 'main_attested',
        consentConfirmedBy: f.main.accountId,
        consentRespondentName: 'Mẹ',
        consentBasis: 'guardian',
      });
      if (status === 'invited') {
        expect((await invitationCall(t, link!.token)).status).toBe(404);
        expect((await f.snapshot(profile.id)).invitations[0].revoked_at).not.toBeNull();
      }
    },
  );
  it('TC-553: hồ sơ người khác kể cả confirmed bị chặn trước idempotent, giữ nguyên dữ liệu', async () => {
    const f = await profileConsentFixture(t);
    const member = await t.session(f.familyId, 'member');
    const profile = await f.create({ linkedAccountId: member.accountId });
    const link = await f.invite(profile.id);
    await invitationCall(t, link.token, { decision: 'accepted', basis: 'self', respondentName: 'An' });
    const before = await f.snapshot(profile.id);
    for (const body of [ATTESTATION, { kind: 'self' }]) {
      const response = await t.call(f.main, 'POST', attestationPath(profile.id), body);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_INVITATION_REQUIRED' } });
    }
    expect(await f.snapshot(profile.id)).toEqual(before);
  });
  it.each(['withdrawn', 'confirmed'] as const)(
    'TC-553: lịch sử withdrawn chặn cả trạng thái %s, kể cả đã mất liên kết',
    async (status) => {
      const f = await profileConsentFixture(t);
      const profile = await f.create();
      await t.owner.query(
        `UPDATE health_profiles SET consent_status=$2,consent_source='invitation',
      consent_confirmed_at=now(),consent_basis='self',consent_respondent_name='An',consent_withdrawn_at=now() WHERE id=$1`,
        [profile.id, status],
      );
      const before = await f.snapshot(profile.id);
      expect((await t.call(f.main, 'POST', attestationPath(profile.id), ATTESTATION)).status).toBe(409);
      expect(await f.snapshot(profile.id)).toEqual(before);
    },
  );
  it.each(['main_attested', 'invitation', 'self'] as const)(
    'TC-554: receipt %s đủ điều kiện được giữ nguyên khi gọi lại',
    async (source) => {
      const f = await profileConsentFixture(t);
      const profile = await f.create(
        source === 'self'
          ? { linkedAccountId: f.main.accountId, consent: { kind: 'self' } }
          : source === 'main_attested'
            ? { consent: ATTESTATION }
            : {},
      );
      if (source === 'invitation') {
        const link = await f.invite(profile.id);
        await invitationCall(t, link.token, { decision: 'accepted', basis: 'self', respondentName: 'An' });
      }
      const before = await f.snapshot(profile.id);
      const body = source === 'self' ? { kind: 'self' } : { ...ATTESTATION, respondentName: 'Tên khác' };
      expect((await t.call(f.main, 'POST', attestationPath(profile.id), body)).status).toBe(200);
      expect(await f.snapshot(profile.id)).toEqual(before);
    },
  );
  it('TC-555: hồ sơ liên kết chính mình ở pending dùng self để xác nhận', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create({ linkedAccountId: f.main.accountId });
    const response = await t.call(f.main, 'POST', attestationPath(profile.id), { kind: 'self' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      consentSource: 'self',
      consentBasis: 'self',
      consentRespondentName: 'Người chăm',
    });
  });
  it('TC-552: body và kết hợp sai trả 422, không sửa hồ sơ/lời mời', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create();
    await f.invite(profile.id);
    const before = await f.snapshot(profile.id);
    for (const body of [
      { kind: 'self' },
      { ...ATTESTATION, attestation: false },
      { ...ATTESTATION, basis: undefined },
      { ...ATTESTATION, respondentName: ' ' },
      { ...ATTESTATION, respondentName: 'a'.repeat(61) },
    ]) {
      expect((await t.call(f.main, 'POST', attestationPath(profile.id), body)).status).toBe(422);
    }
    const own = await f.create({ linkedAccountId: f.main.accountId });
    expect((await t.call(f.main, 'POST', attestationPath(own.id), ATTESTATION)).status).toBe(422);
    expect(await f.snapshot(profile.id)).toEqual(before);
  });
  it('TC-556: member, thiếu CSRF, không phiên và cross-family đều bị chặn, runtime NOBYPASSRLS', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create();
    const before = await f.snapshot(profile.id);
    const member = await t.session(f.familyId, 'member');
    const other = await t.session(await t.family());
    expect((await t.call(member, 'POST', attestationPath(profile.id), ATTESTATION)).status).toBe(403);
    const request = (cookie?: string) =>
      t.app.request(attestationPath(profile.id), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(ATTESTATION),
      });
    expect((await request(f.main.cookie)).status).toBe(403);
    expect((await request()).status).toBe(401);
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', attestationPath(profile.id), ATTESTATION),
      () => t.call(other, 'POST', attestationPath(randomUUID()), ATTESTATION),
    );
    expect(await f.snapshot(profile.id)).toEqual(before);
    expect(
      (await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
});
