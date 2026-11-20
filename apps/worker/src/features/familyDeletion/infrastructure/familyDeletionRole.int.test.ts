import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { useDeletionHarness } from './useDeletionHarness.test-helper.js';

describe('SPEC-069: xoá nhà bằng role xoá nhà trên PostgreSQL thật', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  const { run, seed } = useDeletionHarness(() => fx);
  const count = async (sql: string, params: unknown[]) =>
    Number((await fx.owner.query(sql, params)).rows[0].n);
  async function seedQuotaAudit(f: { familyId: string; accountId: string }) {
    await fx.owner.query("INSERT INTO scan_quota_months(month) VALUES ('2026-11') ON CONFLICT DO NOTHING");
    await fx.owner.query(
      `INSERT INTO scan_quota_audit(id,family_id,month,version,actor_id,occurred_at,after,reason)
       VALUES ($1,$2,'2026-11',1,$3,now(),'{}','test')`,
      [randomUUID(), f.familyId, f.accountId],
    );
  }
  const quotaAudit = (familyId: string) =>
    count('SELECT count(*) n FROM scan_quota_audit WHERE family_id=$1', [familyId]);
  it('TC-806: nhà có nhật ký quota append-only vẫn xoá được, nhật ký quota còn nguyên (D3)', async () => {
    const f = await seed();
    await seedQuotaAudit(f);
    expect(await run()).toEqual({ executed: 1, cancelled: 0, failed: 0 });
    expect(await count('SELECT count(*) n FROM families WHERE id=$1', [f.familyId])).toBe(0);
    expect(await count('SELECT count(*) n FROM health_profiles WHERE family_id=$1', [f.familyId])).toBe(0);
    expect(await quotaAudit(f.familyId)).toBe(1);
  });
  it('TC-919: nhật ký quota và hồ sơ trẻ từng có hai người giám hộ → xoá được, không lỗi trigger, quota audit còn', async () => {
    const f = await seed();
    await seedQuotaAudit(f);
    const [childId, secondId] = [randomUUID(), randomUUID()];
    await fx.owner.query(
      `INSERT INTO health_profiles(id,family_id,display_name,birth_year) VALUES ($1,$2,'Bé',2020)`,
      [childId, f.familyId],
    );
    await fx.owner.query(
      "INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES ($1,$2,'Giám hộ 2',$3,'main')",
      [secondId, `sub-${secondId}`, f.familyId],
    );
    for (const account of [f.accountId, secondId])
      await fx.owner.query(
        'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
        [childId, f.familyId, account],
      );
    // Người giám hộ thứ hai rời nhà trước hạn (xoá giám hộ rồi gỡ khỏi nhà); còn lại Chủ hộ.
    await fx.owner.query('DELETE FROM profile_guardians WHERE account_id=$1', [secondId]);
    await fx.owner.query('UPDATE accounts SET family_id=NULL,family_role=NULL WHERE id=$1', [secondId]);
    expect(await run()).toEqual({ executed: 1, cancelled: 0, failed: 0 });
    for (const table of ['health_profiles', 'profile_guardians'])
      expect(await count(`SELECT count(*) n FROM ${table} WHERE family_id=$1`, [f.familyId])).toBe(0);
    expect(await count('SELECT count(*) n FROM families WHERE id=$1', [f.familyId])).toBe(0);
    expect(await quotaAudit(f.familyId)).toBe(1);
  });
  it('TC-869: job quét và xoá bằng role xoá nhà (SET LOCAL ROLE), không quét families bằng quyền app', async () => {
    const f = await seed();
    const log: string[] = [];
    const logged = {
      connect: async () => {
        const client = await fx.pool.connect();
        const query = client.query.bind(client) as (...args: unknown[]) => unknown;
        client.query = ((text: unknown, ...rest: unknown[]) => {
          if (typeof text === 'string') log.push(text.replace(/\s+/g, ' ').trim());
          return query(text, ...rest);
        }) as typeof client.query;
        return client;
      },
    } as unknown as pg.Pool;
    expect(await run(logged)).toEqual({ executed: 1, cancelled: 0, failed: 0 });
    const role = log.findLastIndex((q) => q.startsWith('SET LOCAL ROLE'));
    const lock = log.findIndex((q) => q.includes('FROM accounts') && q.includes('FOR UPDATE'));
    const del = log.findIndex((q) => q.startsWith('DELETE FROM health_profiles'));
    expect(lock).toBeGreaterThan(-1);
    expect(role).toBeGreaterThan(lock);
    expect(del).toBeGreaterThan(role);
    expect(log.some((q) => /FROM families ORDER BY/.test(q))).toBe(false);
    expect(log.filter((q) => q.startsWith('SET LOCAL ROLE')).length).toBeGreaterThanOrEqual(2);
    expect(await count('SELECT count(*) n FROM families WHERE id=$1', [f.familyId])).toBe(0);
  });
  it('TC-806: mỗi lượt quét chỉ xử lý tối đa 20 nhà đến hạn, nhà đến hạn sớm nhất trước; lượt sau xử lý phần còn lại', async () => {
    const families = [];
    for (let index = 0; index < 21; index += 1) families.push(await seed());
    // Nhà cuối đến hạn sớm nhất: phải nằm trong lượt đầu dù id xếp sau.
    await fx.owner.query(
      "UPDATE family_deletion_requests SET execute_at=now()-interval '24 hours' WHERE id=$1",
      [families[20]!.requestId],
    );
    await fx.owner.query(
      "UPDATE family_deletion_requests SET execute_at=now()-interval '1 minute' WHERE id=$1",
      [families[0]!.requestId],
    );
    expect(await run()).toEqual({ executed: 20, cancelled: 0, failed: 0 });
    const left = await count('SELECT count(*) n FROM families WHERE id=ANY($1)', [
      families.map((f) => f.familyId),
    ]);
    expect(left).toBe(1);
    expect(await count('SELECT count(*) n FROM families WHERE id=$1', [families[20]!.familyId])).toBe(0);
    expect(await run()).toEqual({ executed: 1, cancelled: 0, failed: 0 });
  });
});
