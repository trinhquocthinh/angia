import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { aiBillingViewSchema, budgetMonth } from '@angia/contracts';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';

const PATH = '/api/admin/ai-billing';
const NOW = new Date('2026-10-31T17:01:00Z');
describe('Phí thực nhà cung cấp toàn hệ thống qua Admin', () => {
  let t: AdminTestApp;
  const read = async () => aiBillingViewSchema.parse(await (await t.call(t.admin, 'GET', PATH)).json());
  const seedSource = async (provider: string, ageSeconds = 0, status = 'complete') => {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO ai_billing_sources
      (id, provider, credential_fingerprint, status, last_attempt_at, last_complete_at)
      VALUES ($1, $2, $6, $3, $4, $5)`,
      [
        id,
        provider,
        status,
        NOW,
        new Date(NOW.getTime() - ageSeconds * 1000),
        `synthetic-secret-fingerprint-${id}`,
      ],
    );
    return id;
  };
  beforeAll(async () => {
    t = await startAdminTestApp({ aiBillingNow: () => NOW });
  });
  afterAll(async () => {
    await t?.stop();
  });
  beforeEach(async () => {
    await t.owner.query('DELETE FROM ai_provider_charges');
    await t.owner.query('DELETE FROM ai_billing_sources');
  });
  it('TC-539: không có nguồn trả 0 đã xác nhận, actual null và no-store', async () => {
    const response = await t.call(t.admin, 'GET', PATH);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      month: budgetMonth(NOW),
      unit: 'USD',
      status: 'unconfigured',
      confirmedSpendUsd: '0.000000000000',
      actualSpendUsd: null,
      lastSyncedAt: null,
      sources: [],
    });
  });
  it('TC-539: chỉ admin được đọc, main/member của hai gia đình bị từ chối', async () => {
    expect((await t.app.request(PATH)).status).toBe(401);
    for (const familyRole of ['main', 'member'] as const) {
      const familyId = await t.seedFamily();
      const user = await seedSession(t.owner, await seedAccount(t.owner, { familyId, familyRole }));
      expect((await t.call(user, 'GET', PATH)).status).toBe(403);
    }
  });
  it('TC-539: cộng numeric trước làm tròn, theo tháng VN và không trả secret', async () => {
    const woku = await seedSource('woku');
    const openrouter = await seedSource('openrouter');
    const month = budgetMonth(NOW);
    const insert = (id: string, ext: string, offset: string, amount: string, divisor: string) =>
      t.owner.query(
        `INSERT INTO ai_provider_charges VALUES ($1, $2,
        ($3::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') + $4::interval, $5, $6)`,
        [id, ext, `${month}-01`, offset, amount, divisor],
      );
    await insert(woku, 'before-vn', '-1 second', '999', '1');
    await insert(woku, 'vn-start', '0 second', '9007199254740993.123456789012', '1');
    await insert(woku, 'third-a', '1 second', '1', '3');
    await insert(openrouter, 'third-b', '2 seconds', '2', '3');
    await insert(openrouter, 'next-vn', '1 month', '888', '1');
    const view = await read();
    expect(view.status).toBe('ready');
    expect(view.actualSpendUsd).toBe('9007199254740994.123456789012');
    expect(view.confirmedSpendUsd).toBe(view.actualSpendUsd);
    expect(view.sources.find((s) => s.id === openrouter)?.confirmedSpendUsd).toBe('0.666666666667');
    expect(JSON.stringify(view)).not.toMatch(/fingerprint|credential|last_counter|synthetic-secret/);
  });
  it('TC-539: nhiều nguồn giữ lịch sử và dùng mốc hoàn tất cũ nhất', async () => {
    await seedSource('woku');
    await seedSource('openrouter');
    const staleId = await seedSource('woku', 181);
    const view = await read();
    expect(view.sources).toHaveLength(3);
    expect(view).toMatchObject({ status: 'stale', actualSpendUsd: null });
    expect(view.lastSyncedAt).toBe(view.sources.find((s) => s.id === staleId)?.lastCompleteAt);
  });
  it('TC-539: mốc hoàn tất ở tương lai bị từ chối, không trả ready 0', async () => {
    await seedSource('woku');
    await seedSource('openrouter', -1);
    expect(await read()).toMatchObject({ status: 'incomplete', actualSpendUsd: null });
  });
  it('TC-539: credential đã lưu không được đăng ký lại với UUID mới sau khi bỏ khỏi cấu hình', async () => {
    const originalId = await seedSource('woku');
    await t.owner.query("UPDATE ai_billing_sources SET status = 'missing_credential' WHERE id = $1", [
      originalId,
    ]);
    await t.owner.query('INSERT INTO ai_provider_charges VALUES ($1, $2, $3, 12, 3)', [
      originalId,
      'retained-charge',
      NOW,
    ]);
    await expect(
      t.owner.query(
        `INSERT INTO ai_billing_sources (id, provider, credential_fingerprint)
      SELECT $1, provider, credential_fingerprint FROM ai_billing_sources WHERE id = $2`,
        [randomUUID(), originalId],
      ),
    ).rejects.toMatchObject({ code: '23505', constraint: 'ai_billing_sources_credential_unique' });
    const { rows } = await t.owner.query(`SELECT s.id, s.status, c.external_id
      FROM ai_billing_sources s JOIN ai_provider_charges c ON c.source_id = s.id`);
    expect(rows).toEqual([{ id: originalId, status: 'missing_credential', external_id: 'retained-charge' }]);
    expect((await read()).confirmedSpendUsd).toBe('4.000000000000');
  });
  it('TC-539: một provider hoặc nguồn gap không được ready 0', async () => {
    await seedSource('woku');
    expect((await read()).status).toBe('incomplete');
    await seedSource('openrouter', 0, 'gap');
    expect(await read()).toMatchObject({ status: 'incomplete', actualSpendUsd: null });
  });
});
