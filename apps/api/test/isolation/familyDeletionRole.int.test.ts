import { randomUUID } from 'node:crypto';
import { PgBoss } from 'pg-boss';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHouseholdDatabase } from '@src/shared/test/startHouseholdDatabase.js';
import {
  asFamilyDeletionRole,
  seedFamilyDeletionCase,
  type DeletionCaseState,
} from '@src/shared/test/seedFamilyDeletionCase.js';

const PROBE_QUEUE = 'tc869-purge-probe';

describe('TC-869: role xoá nhà chỉ chạm nhà có yêu cầu pending đến hạn (E28-S2-T2)', () => {
  let t: Awaited<ReturnType<typeof startHouseholdDatabase>>;
  let boss: PgBoss;
  const q = (text: string, values: unknown[] = []) => t.app.query(text, values);
  const finalize = (request: string) => q('SELECT public.finalize_family_deletion($1)', [request]);
  const asRole = <T>(family: string | null, work: () => Promise<T>, commit = false) =>
    asFamilyDeletionRole(t.app, family, work, commit);

  beforeAll(async () => {
    t = await startHouseholdDatabase();
    boss = new PgBoss({ connectionString: t.db.appUrl, migrate: false, createSchema: false });
    await boss.start();
    await boss.createQueue(PROBE_QUEUE);
  });
  afterAll(async () => {
    await boss?.stop({ graceful: false });
    await t?.stop();
  });

  it.each<DeletionCaseState>(['none', 'revoked', 'not_due'])(
    'TC-869: nhà %s — 0 dòng, không xoá được, finalize bị từ chối',
    async (state) => {
      const c = await seedFamilyDeletionCase(t.owner, state);
      await asRole(c.family, async () => {
        expect((await q('SELECT id FROM health_profiles')).rows).toEqual([]);
        expect((await q('SELECT id FROM family_deletion_requests')).rows).toEqual([]);
        expect((await q('DELETE FROM health_profiles WHERE family_id=$1', [c.family])).rowCount).toBe(0);
      });
      await expect(asRole(c.family, () => finalize(c.request))).rejects.toMatchObject({ code: '55000' });
      expect((await t.owner.query('SELECT id FROM families WHERE id=$1', [c.family])).rowCount).toBe(1);
    },
  );

  it('TC-869: nhà đến hạn — đọc/xoá được, finalize qua COMMIT; Chủ hộ còn tài khoản, nhật ký còn', async () => {
    const c = await seedFamilyDeletionCase(t.owner, 'due');
    await t.owner.query("INSERT INTO scan_quota_months(month) VALUES('2026-11') ON CONFLICT DO NOTHING");
    await t.owner.query(
      `INSERT INTO scan_quota_audit(id,family_id,month,version,actor_id,occurred_at,after,reason)
       VALUES($1,$2,'2026-11',1,$3,now(),'{}','cấp quota')`,
      [randomUUID(), c.family, c.account],
    );
    await asRole(
      c.family,
      async () => {
        expect((await q('SELECT id FROM health_profiles')).rows).toEqual([{ id: c.profile }]);
        expect((await q('SELECT id FROM family_deletion_requests')).rows).toEqual([{ id: c.request }]);
        expect((await q('DELETE FROM health_profiles WHERE family_id=$1', [c.family])).rowCount).toBe(1);
        await q('INSERT INTO object_purges(object_key,family_id) VALUES($1,$2)', [
          `tc869/${c.family}`,
          c.family,
        ]);
        await q(
          `INSERT INTO admin_audit_events(id,actor_account_id,family_id,action)
           VALUES($1,'system_admin',$2,'family_deletion_executed')`,
          [randomUUID(), c.family],
        );
        await finalize(c.request);
      },
      true,
    );
    const left = async (sql: string) => (await t.owner.query(sql, [c.family])).rowCount;
    expect(await left('SELECT 1 FROM families WHERE id=$1')).toBe(0);
    expect(await left('SELECT 1 FROM family_deletion_requests WHERE family_id=$1')).toBe(0);
    expect(await left('SELECT 1 FROM object_purges WHERE family_id=$1')).toBe(1);
    expect(await left('SELECT 1 FROM admin_audit_events WHERE family_id=$1')).toBe(1);
    expect(await left('SELECT 1 FROM scan_quota_audit WHERE family_id=$1')).toBe(1);
    expect(
      (
        await t.owner.query('SELECT family_id,family_role,health_profile_id FROM accounts WHERE id=$1', [
          c.account,
        ])
      ).rows,
    ).toEqual([{ family_id: null, family_role: null, health_profile_id: null }]);
  });

  it('TC-869: finalize lỗi khi nhà còn người khác hoặc còn dữ liệu sức khỏe', async () => {
    const crowded = await seedFamilyDeletionCase(t.owner, 'due', 1);
    await expect(asRole(crowded.family, () => finalize(crowded.request))).rejects.toMatchObject({
      code: '23514',
    });
    const withData = await seedFamilyDeletionCase(t.owner, 'due');
    await expect(asRole(withData.family, () => finalize(withData.request))).rejects.toMatchObject({
      code: '23503',
    });
  });

  it('TC-869: ngoài grant D1 bị từ chối — xoá/sửa accounts, sửa dữ liệu sức khỏe, đọc nhật ký', async () => {
    const c = await seedFamilyDeletionCase(t.owner, 'due');
    for (const sql of [
      'DELETE FROM accounts',
      "UPDATE accounts SET display_name='x'",
      "UPDATE health_profiles SET display_name='x'",
      'SELECT id FROM admin_audit_events',
      'DELETE FROM scan_quota_audit',
      'DELETE FROM object_purges',
      'SELECT id FROM families',
    ]) {
      await expect(asRole(c.family, () => q(sql))).rejects.toMatchObject({ code: '42501' });
    }
    await expect(finalize(c.request)).rejects.toMatchObject({ code: '42501' });
  });

  it('TC-869: quét không cần GUC chỉ thấy yêu cầu đến hạn; chỉ huỷ được, không hoãn; enqueue pg-boss được', async () => {
    const due = await seedFamilyDeletionCase(t.owner, 'due');
    const notDue = await seedFamilyDeletionCase(t.owner, 'not_due');
    const ids = await asRole(null, async () =>
      (await q('SELECT id FROM family_deletion_requests')).rows.map((row) => row.id as string),
    );
    expect(ids).toContain(due.request);
    expect(ids).not.toContain(notDue.request);
    await expect(
      asRole(due.family, () =>
        q("UPDATE family_deletion_requests SET execute_at=now()+interval '1 day' WHERE id=$1", [due.request]),
      ),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      asRole(due.family, () =>
        q(
          `UPDATE family_deletion_requests SET status='revoked',revoked_at=now()-interval '1 second'
           WHERE id=$1`,
          [due.request],
        ),
      ),
    ).rejects.toMatchObject({ code: '42501' });
    const revoked = await asRole(due.family, () =>
      q(
        `UPDATE family_deletion_requests SET status='revoked',revoked_at=now(),cancel_reason='family_not_empty'
         WHERE id=$1`,
        [due.request],
      ),
    );
    expect(revoked.rowCount).toBe(1);
    const db = { executeSql: async (text: string, values?: unknown[]) => q(text, values) };
    const jobId = await asRole(due.family, () => boss.send(PROBE_QUEUE, { familyId: due.family }, { db }));
    expect(jobId).toEqual(expect.any(String));
  });

  it('TC-869: policy không lan sang role app — app trong phạm vi nhà vẫn thấy dữ liệu và yêu cầu', async () => {
    for (const state of ['none', 'not_due'] as const) {
      const c = await seedFamilyDeletionCase(t.owner, state);
      await q('BEGIN');
      try {
        await q("SELECT set_config('app.family_id',$1,true)", [c.family]);
        expect((await q('SELECT id FROM health_profiles')).rows).toEqual([{ id: c.profile }]);
        const requests = (await q('SELECT id FROM family_deletion_requests')).rows;
        expect(requests).toEqual(state === 'none' ? [] : [{ id: c.request }]);
      } finally {
        await q('ROLLBACK');
      }
    }
  });
});
