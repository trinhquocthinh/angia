import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { ATTESTATION, PROFILE_BASE, profileConsentFixture } from '@src/shared/test/profileConsentFixture.js';

describe('LG-02: tạo hồ sơ kèm đồng thuận trên PostgreSQL', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-549: cam kết guardian tạo đủ receipt, không sinh link, tải ảnh được ngay', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create({ consent: ATTESTATION });
    expect(profile).toMatchObject({
      consentStatus: 'confirmed',
      consentSource: 'main_attested',
      consentConfirmedBy: f.main.accountId,
      consentBasis: 'guardian',
      consentRespondentName: 'Mẹ',
    });
    expect(profile.consentConfirmedAt).not.toBeNull();
    expect((await f.snapshot(profile.id)).invitations).toEqual([]);
    expect((await f.upload(f.main, profile.id)).status).toBe(201);
  });
  it('TC-550: không gửi consent giữ pending và chặn ghi dữ liệu', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create();
    expect(profile).toMatchObject({
      consentStatus: 'pending',
      consentSource: null,
      consentConfirmedAt: null,
    });
    const response = await f.upload(f.main, profile.id);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    expect(
      (await t.owner.query('SELECT * FROM upload_batches WHERE health_profile_id=$1', [profile.id])).rows,
    ).toEqual([]);
  });
  it('TC-555: tự xác nhận lấy tên tài khoản và liên kết đúng, upload được ngay', async () => {
    const f = await profileConsentFixture(t);
    await t.owner.query('UPDATE accounts SET display_name=$1 WHERE id=$2', [
      '  Nguyễn An ',
      f.main.accountId,
    ]);
    const profile = await f.create({ linkedAccountId: f.main.accountId, consent: { kind: 'self' } });
    expect(profile).toMatchObject({
      consentStatus: 'confirmed',
      consentSource: 'self',
      consentBasis: 'self',
      consentConfirmedBy: f.main.accountId,
      consentRespondentName: 'Nguyễn An',
    });
    expect(
      (await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [f.main.accountId])).rows[0]
        .health_profile_id,
    ).toBe(profile.id);
    expect((await f.snapshot(profile.id)).invitations).toEqual([]);
    expect((await f.upload(f.main, profile.id)).status).toBe(201);
  });
  it('TC-552: payload sai trả 422 và không tạo hồ sơ hay liên kết một phần', async () => {
    const f = await profileConsentFixture(t);
    const other = await t.session(f.familyId);
    for (const input of [
      { consent: { ...ATTESTATION, attestation: false } },
      { consent: { ...ATTESTATION, basis: undefined } },
      { consent: { ...ATTESTATION, respondentName: ' ' } },
      { consent: { ...ATTESTATION, respondentName: 'a'.repeat(61) } },
      { consent: ATTESTATION, linkedAccountId: f.main.accountId },
      { consent: { kind: 'self' }, linkedAccountId: other.accountId },
      { consent: { kind: 'self' } },
    ]) {
      const response = await t.call(f.main, 'POST', PROFILE_BASE, {
        birthYear: 1950,
        displayName: 'Bé',
        ...input,
      });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await (await t.call(f.main, 'GET', PROFILE_BASE)).json()).toEqual([]);
    expect(
      (
        await t.owner.query('SELECT health_profile_id FROM accounts WHERE family_id=$1', [f.familyId])
      ).rows.every((a) => a.health_profile_id === null),
    ).toBe(true);
  });
  it('TC-549: phản hồi tạo hồ sơ có no-store', async () => {
    const f = await profileConsentFixture(t);
    const response = await t.call(f.main, 'POST', PROFILE_BASE, {
      birthYear: 1950,
      displayName: 'Bé',
      consent: ATTESTATION,
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(((await response.json()) as HealthProfile).consentSource).toBe('main_attested');
  });
});
