import { randomUUID } from 'node:crypto';
import { budgetMonth, REQUEUE_AWAITING_BUDGET_QUEUE } from '@angia/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { type AdminTestApp, startAdminTestApp } from '@src/shared/test/startAdminTestApp.js';

const LIST = '/api/admin/family-extraction-caps';
const capPath = (id: string) => `/api/admin/families/${id}/extraction-cap`;

describe('API trần chi phí OCR theo gia đình (SPEC-031)', () => {
  let t: AdminTestApp;
  const month = () => budgetMonth(new Date());
  const requeueJobs = async () =>
    (
      await t.owner.query(`SELECT data FROM pgboss.job WHERE name = $1 ORDER BY created_on`, [
        REQUEUE_AWAITING_BUDGET_QUEUE,
      ])
    ).rows.map((row) => row.data);

  beforeAll(async () => {
    t = await startAdminTestApp();
  });
  afterAll(async () => t?.stop());
  beforeEach(async () => {
    await t.owner.query('DELETE FROM pgboss.job WHERE name = $1', [REQUEUE_AWAITING_BUDGET_QUEUE]);
  });

  it('TC-308: chỉ Quản trị hệ thống; trần sai cent/ngoài khoảng → 422; gia đình lạ → 404', async () => {
    const familyId = await t.seedFamily('Nhà Kiểm');
    const main = await seedSession(t.owner, await seedAccount(t.owner, { familyId, familyRole: 'main' }));
    expect((await t.call(main, 'GET', LIST)).status).toBe(403);
    expect((await t.call(main, 'PUT', capPath(familyId), { capUsd: 1 })).status).toBe(403);
    expect((await t.call(t.admin, 'PUT', capPath(familyId), { capUsd: 0.505 })).status).toBe(422);
    expect((await t.call(t.admin, 'PUT', capPath(familyId), { capUsd: 101 })).status).toBe(422);
    expect((await t.call(t.admin, 'PUT', capPath(randomUUID()), { capUsd: 1 })).status).toBe(404);
  });

  it('TC-308: danh sách kèm chi tiêu tháng (đọc qua RLS từng gia đình) và null = về mặc định', async () => {
    const a = await t.seedFamily('Nhà A');
    await t.owner.query(
      `INSERT INTO extraction_spend (month, cap_usd) VALUES ($1, 5) ON CONFLICT DO NOTHING`,
      [month()],
    );
    await t.owner.query(
      `INSERT INTO family_extraction_spend (family_id, month, spent_usd) VALUES ($1, $2, 0.21)`,
      [a, month()],
    );
    const list = await t.call(t.admin, 'GET', LIST);
    expect(list.status).toBe(200);
    expect(list.headers.get('cache-control')).toBe('no-store');
    expect(await list.json()).toContainEqual({
      familyId: a,
      familyName: 'Nhà A',
      month: month(),
      capUsd: 0.5,
      capIsDefault: true,
      spentUsd: 0.21,
    });
    expect(await (await t.call(t.admin, 'PUT', capPath(a), { capUsd: 0.3 })).json()).toMatchObject({
      capUsd: 0.3,
      capIsDefault: false,
    });
    expect(await (await t.call(t.admin, 'PUT', capPath(a), { capUsd: null })).json()).toMatchObject({
      capUsd: 0.5,
      capIsDefault: true,
      spentUsd: 0.21,
    });
  });

  it('TC-307: nâng trần gửi job requeue kèm familyId; hạ trần không gửi job, không đổi trạng thái', async () => {
    const a = await t.seedFamily('Nhà B');
    expect((await t.call(t.admin, 'PUT', capPath(a), { capUsd: 1 })).status).toBe(200);
    expect(await requeueJobs()).toEqual([{ familyId: a }]);
    expect((await t.call(t.admin, 'PUT', capPath(a), { capUsd: 0.2 })).status).toBe(200);
    expect(await requeueJobs()).toHaveLength(1);
    const row = await t.owner.query('SELECT extraction_cap_usd FROM families WHERE id = $1', [a]);
    expect(row.rows[0].extraction_cap_usd).toBe('0.20');
  });
});
