import { budgetMonth, REQUEUE_AWAITING_BUDGET_QUEUE } from '@angia/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { type AdminTestApp, startAdminTestApp } from '@src/shared/test/startAdminTestApp.js';

const PATH = '/api/admin/extraction-cap';

describe('API trần ngân sách AI: SPEC-013 (E3-S6-T2)', () => {
  let t: AdminTestApp;
  const month = () => budgetMonth(new Date());
  const setSpend = (spent: number, cap: number) =>
    t.owner.query('INSERT INTO extraction_spend (month, spent_usd, cap_usd) VALUES ($1, $2, $3)', [
      month(),
      spent,
      cap,
    ]);
  const capInDb = async () =>
    (await t.owner.query('SELECT cap_usd FROM extraction_spend WHERE month = $1', [month()])).rows[0]
      ?.cap_usd;
  const requeueJobs = async () =>
    (
      await t.owner.query('SELECT count(*)::int AS n FROM pgboss.job WHERE name = $1', [
        REQUEUE_AWAITING_BUDGET_QUEUE,
      ])
    ).rows[0].n;

  beforeAll(async () => {
    t = await startAdminTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  beforeEach(async () => {
    await t.owner.query('DELETE FROM extraction_spend');
    await t.owner.query('DELETE FROM pgboss.job WHERE name = $1', [REQUEUE_AWAITING_BUDGET_QUEUE]);
  });

  it('GET: tháng chưa có dòng → trần mặc định, đã dùng 0, không ghi DB', async () => {
    const response = await t.call(t.admin, 'GET', PATH);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ month: month(), monthlyCapUsd: 5, spentThisMonthUsd: 0 });
    expect(await capInDb()).toBeUndefined();
  });

  it('TC-041: đã dùng $3.00, Quản trị viên đặt trần $2.00 → lưu trần, không đưa lại hàng đợi', async () => {
    await setSpend(3, 5);
    const response = await t.call(t.admin, 'PUT', PATH, { monthlyCapUsd: 2 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ month: month(), monthlyCapUsd: 2, spentThisMonthUsd: 3 });
    expect(await capInDb()).toBe('2.00');
    expect(await requeueJobs()).toBe(0);
  });

  it('nâng trần → gửi đúng một job requeue-awaiting-budget cùng transaction', async () => {
    await setSpend(3, 2);
    expect((await t.call(t.admin, 'PUT', PATH, { monthlyCapUsd: 4.5 })).status).toBe(200);
    expect(await capInDb()).toBe('4.50');
    expect(await requeueJobs()).toBe(1);
  });

  it('TC-042: phiên main thông thường đổi trần → ERR_FORBIDDEN, trần giữ nguyên', async () => {
    await setSpend(1, 5);
    const main = await seedSession(
      t.owner,
      await seedAccount(t.owner, { familyId: await t.seedFamily(), familyRole: 'main' }),
    );
    for (const [method, body] of [
      ['PUT', { monthlyCapUsd: 50 }],
      ['GET', undefined],
    ] as const) {
      const response = await t.call(main, method, PATH, body);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    }
    expect(await capInDb()).toBe('5.00');
    expect(await requeueJobs()).toBe(0);
  });

  it('ERR_VALIDATION: ngoài 0.00 – 100.00 hoặc lẻ hơn 0.01', async () => {
    for (const monthlyCapUsd of [-1, 100.01, 1.005, '2']) {
      const response = await t.call(t.admin, 'PUT', PATH, { monthlyCapUsd });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await capInDb()).toBeUndefined();
  });
});
