import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

describe('SPEC-061: gate legal qua HTTP và PostgreSQL role app', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  let user: Awaited<ReturnType<typeof seedSession>>;
  let otherAccount: string;
  let profileId: string;
  let v2: string;
  beforeAll(async () => {
    t = await startRegistrationTestApp(true);
  });
  afterAll(async () => {
    await t?.close();
  });
  beforeEach(async () => {
    await t.owner.query(
      "DELETE FROM legal_acceptances; DELETE FROM legal_document_versions WHERE version != '1.0.0'",
    );
    const familyId = randomUUID();
    profileId = randomUUID();
    await t.owner.query('INSERT INTO families(id,name) VALUES($1,$2)', [familyId, 'Nhà thử']);
    user = await seedSession(t.owner, await seedAccount(t.owner, { familyId, familyRole: 'main' }));
    otherAccount = await seedAccount(t.owner);
    await t.owner.query(
      `INSERT INTO health_profiles(id,family_id,display_name,consent_status,
        consent_confirmed_at,consent_confirmed_by,consent_basis,consent_source,consent_respondent_name)
       VALUES($1,$2,$3,'confirmed',now(),$4,'guardian','main_attested',$3)`,
      [profileId, familyId, 'Người thử', user.accountId],
    );
    v2 = await publish('2', true, '2026-02-01');
  });
  const publish = async (version: string, material: boolean, date: string) => {
    const id = randomUUID();
    await t.owner.query(
      "INSERT INTO legal_document_versions(id,kind,version,published_at,material,content_path,sha256) VALUES($1,'terms',$2,$3,$4,'legal/terms.md',repeat('a',64))",
      [id, version, date, material],
    );
    return id;
  };
  const call = (path: string, method = 'GET', body?: unknown) =>
    t.app.request(path, {
      method,
      headers: { cookie: user.cookie, 'x-csrf-token': user.csrf, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const medicationPath = () => `/api/health-profiles/${profileId}/medication-courses/current`;
  const accept = (versionIds = [v2]) => call('/api/me/legal-acceptances', 'POST', { versionIds });
  const history = async (accountId = user.accountId) =>
    (
      await t.owner.query(
        'SELECT version_id,accepted_at FROM legal_acceptances WHERE account_ref=(SELECT legal_ref FROM accounts WHERE id=$1) ORDER BY version_id',
        [accountId],
      )
    ).rows;

  it('TC-752: v2 trọng yếu chặn đọc thuốc; xem tài khoản và đăng xuất vẫn dùng được', async () => {
    const response = await call(medicationPath());
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_LEGAL_ACCEPTANCE_REQUIRED' } });
    expect((await call('/api/me')).status).toBe(200);
    // Tải dữ liệu SPEC-072 chưa có route; bổ sung ca miễn khi triển khai SPEC-072.
    expect((await call('/api/auth/logout', 'POST')).status).toBe(204);
  });
  it('TC-753: đồng ý v2 mở đọc thuốc, giữ v1, lặp lại không sửa hoặc trùng và chỉ ghi chính chủ', async () => {
    const beforeOther = await history(otherAccount);
    expect((await accept()).status).toBe(204);
    expect((await call(medicationPath())).status).toBe(200);
    const before = await history();
    expect(before).toHaveLength(3);
    expect(before.map((r) => r.version_id)).toContain(t.legalAcceptance.termsVersionId);
    expect(before.map((r) => r.version_id)).toContain(v2);
    expect((await accept()).status).toBe(204);
    expect(await history()).toEqual(before);
    expect(await history(otherAccount)).toEqual(beforeOther);
  });
  it('TC-754: v3 không trọng yếu không chặn sau khi đồng ý v2', async () => {
    expect((await accept()).status).toBe(204);
    await publish('3', false, '2026-03-01');
    expect((await call(medicationPath())).status).toBe(200);
  });
  it('TC-754: v3 không trọng yếu không che v2 trọng yếu chưa đồng ý', async () => {
    await publish('3', false, '2026-03-01');
    expect((await call(medicationPath())).status).toBe(403);
  });
  it('TC-755: account OIDC cũ chưa đồng ý bị chặn rồi mở sau đồng ý', async () => {
    const family = (await t.owner.query('SELECT family_id FROM accounts WHERE id=$1', [user.accountId]))
      .rows[0].family_id;
    user = await seedSession(
      t.owner,
      await seedAccount(t.owner, { familyId: family, familyRole: 'main', legalAccepted: false }),
    );
    expect((await call(medicationPath())).status).toBe(403);
    expect((await accept([v2, t.legalAcceptance.privacyVersionId])).status).toBe(204);
    expect((await call(medicationPath())).status).toBe(200);
  });
  it('TC-755: phiên local cũng bị gate khi thiếu đồng ý', async () => {
    await t.owner.query("UPDATE sessions SET auth_method='local' WHERE id=$1", [user.id]);
    expect((await call(medicationPath())).status).toBe(403);
    expect((await accept()).status).toBe(204);
    expect((await call(medicationPath())).status).toBe(200);
  });
  it('TC-755: enrollment trước cutover không bị gate legal', async () => {
    const response = await call('/api/me/local-credential', 'POST', { password: 'NewPassword123' });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
  });
  it('TC-753: một ID cũ hoặc không tồn tại làm toàn bộ lần ghi bị từ chối', async () => {
    const before = await history();
    const response = await accept([v2, randomUUID()]);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'ERR_LEGAL_VERSION_OUTDATED',
        details: { current: { termsVersionId: v2, privacyVersionId: t.legalAcceptance.privacyVersionId } },
      },
    });
    expect(await history()).toEqual(before);
    expect((await accept([t.legalAcceptance.termsVersionId])).status).toBe(409);
  });
  it('TC-752: bản tương lai không phải hiện hành hoặc ngưỡng bắt buộc', async () => {
    await accept();
    await publish('future', true, '2099-01-01');
    const current = await call('/api/legal/current');
    expect(current.status).toBe(200);
    expect(await current.json()).toMatchObject({ terms: { id: v2 } });
    expect((await call(medicationPath())).status).toBe(200);
  });
  it('TC-753: mở gate vẫn giữ cô lập dữ liệu sức khỏe đa gia đình', async () => {
    await accept();
    const family = randomUUID();
    const otherProfile = randomUUID();
    await t.owner.query('INSERT INTO families(id,name) VALUES($1,$2)', [family, 'Nhà khác']);
    await t.owner.query('INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,$3)', [
      otherProfile,
      family,
      'Người khác',
    ]);
    await expectCrossFamilyDenied(
      () => call(`/api/health-profiles/${otherProfile}/medication-courses/current`),
      () => call(`/api/health-profiles/${randomUUID()}/medication-courses/current`),
    );
  });
  it('TC-752: bảng legal rỗng đóng gate; GET hiện hành trả ERR_INTERNAL', async () => {
    // Khôi phục hai bản v1 trong finally để fixture các ca sau không bị ảnh hưởng.
    await t.owner.query('DELETE FROM legal_acceptances; DELETE FROM legal_document_versions');
    try {
      expect((await call(medicationPath())).status).toBe(403);
      const response = await call('/api/legal/current');
      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_INTERNAL' } });
    } finally {
      await t.owner.query(
        "INSERT INTO legal_document_versions(id,kind,version,published_at,material,content_path,sha256) VALUES($1,'terms','1.0.0','2026-01-01',true,'legal/terms.md',repeat('a',64)),($2,'privacy','1.0.0','2026-01-01',true,'legal/privacy.md',repeat('b',64))",
        [t.legalAcceptance.termsVersionId, t.legalAcceptance.privacyVersionId],
      );
    }
  });
});
