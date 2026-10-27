import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ProfileListItem } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { ATTESTATION, PROFILE_BASE, profileConsentFixture } from '@src/shared/test/profileConsentFixture.js';
describe('TC-558 — danh sách metadata trong phiên main, PostgreSQL thật', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('chọn đúng cam kết/self/link; tên cam kết đúng tài khoản, không phải người đồng ý', async () => {
    const f = await profileConsentFixture(t);
    const member = await t.session(f.familyId, 'member', 'Người thân');
    const unlinked = await f.create();
    const own = await f.create({ linkedAccountId: f.main.accountId });
    const other = await f.create({ linkedAccountId: member.accountId });
    const confirmed = await f.create({ consent: ATTESTATION });
    const response = await t.call(f.main, 'GET', PROFILE_BASE);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const rows = (await response.json()) as ProfileListItem[];
    expect(rows.find((p) => p.id === unlinked.id)).toMatchObject({ consentAction: 'attestation' });
    expect(rows.find((p) => p.id === own.id)).toMatchObject({ consentAction: 'self' });
    expect(rows.find((p) => p.id === other.id)).toMatchObject({ consentAction: 'invitation' });
    expect(rows.find((p) => p.id === confirmed.id)).toMatchObject({
      consentAction: null,
      consentConfirmedByName: 'Người chăm',
      consentRespondentName: 'Mẹ',
    });
    for (const row of rows) {
      expect(row).not.toHaveProperty('linkedAccountId');
      expect(row).not.toHaveProperty('consentWithdrawnAt');
    }
    const another = await t.session(f.familyId, 'main', 'Main khác');
    const otherRows = (await (await t.call(another, 'GET', PROFILE_BASE)).json()) as ProfileListItem[];
    expect(otherRows.find((p) => p.id === own.id)?.consentAction).toBe('invitation');
    expect((await t.call(member, 'GET', PROFILE_BASE)).status).toBe(403);
  });
  it('hồ sơ từng rút không được cam kết, cả khi trạng thái hiện tại là pending', async () => {
    const f = await profileConsentFixture(t);
    const unlinked = await f.create();
    const own = await f.create({ linkedAccountId: f.main.accountId });
    for (const profile of [unlinked, own])
      await t.owner.query(
        "UPDATE health_profiles SET consent_status='withdrawn', consent_withdrawn_at=now(), consent_withdrawn_by=$2 WHERE id=$1",
        [profile.id, f.main.accountId],
      );
    const read = async () => (await (await t.call(f.main, 'GET', PROFILE_BASE)).json()) as ProfileListItem[];
    let rows = await read();
    expect(rows.find((p) => p.id === unlinked.id)?.consentAction).toBeNull();
    expect(rows.find((p) => p.id === own.id)?.consentAction).toBe('invitation');
    await t.owner.query("UPDATE health_profiles SET consent_status='pending' WHERE id=$1", [unlinked.id]);
    rows = await read();
    expect(rows.find((p) => p.id === unlinked.id)?.consentAction).toBeNull();
  });
  it('không lẫn hồ sơ/tên tài khoản gia đình khác hoặc tài khoản cam kết đã chuyển nhóm', async () => {
    const f = await profileConsentFixture(t);
    const created = await f.create({ consent: ATTESTATION });
    const otherFamily = await t.family();
    const another = await t.session(f.familyId, 'main');
    const outsider = await t.session(otherFamily);
    expect(await (await t.call(outsider, 'GET', PROFILE_BASE)).json()).toEqual([]);
    await t.owner.query('UPDATE accounts SET family_id=$2 WHERE id=$1', [f.main.accountId, otherFamily]);
    const rows = (await (await t.call(another, 'GET', PROFILE_BASE)).json()) as ProfileListItem[];
    expect(rows.find((p) => p.id === created.id)?.consentConfirmedByName).toBeNull();
  });
});
