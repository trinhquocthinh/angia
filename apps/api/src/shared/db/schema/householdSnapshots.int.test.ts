import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHouseholdDatabase } from '@src/shared/test/startHouseholdDatabase.js';

describe('E27-S2-T1: chống snapshot cũ phá bất biến nhà', () => {
  let t: Awaited<ReturnType<typeof startHouseholdDatabase>>;
  beforeAll(async () => {
    t = await startHouseholdDatabase();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('giới hạn hai người giám hộ giữ nguyên với snapshot REPEATABLE READ', async () => {
    const { family, profile, accounts } = await t.seed();
    await t.owner.query('INSERT INTO profile_guardians VALUES($1,$2,$3,now())', [
      profile,
      family,
      accounts[0],
    ]);
    const second = new pg.Client({ connectionString: t.db.ownerUrl });
    await second.connect();
    try {
      for (const client of [t.owner, second]) {
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
        await client.query('SELECT * FROM profile_guardians WHERE health_profile_id=$1', [profile]);
      }
      const results = await Promise.allSettled(
        [t.owner, second].map(async (client, index) => {
          await client.query('INSERT INTO profile_guardians VALUES($1,$2,$3,now())', [
            profile,
            family,
            accounts[index + 1],
          ]);
          await client.query('COMMIT');
        }),
      );
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    } finally {
      await t.owner.query('ROLLBACK');
      await second.query('ROLLBACK');
      await second.end();
    }
    expect(
      (
        await t.owner.query(
          'SELECT count(*)::int AS total FROM profile_guardians WHERE health_profile_id=$1',
          [profile],
        )
      ).rows,
    ).toEqual([{ total: 2 }]);
  });

  it.each(['owner', 'guardian'])('snapshot cũ không hạ main vừa được gán %s', async (kind) => {
    const { family, profile, accounts } = await t.seed();
    const second = new pg.Client({ connectionString: t.db.ownerUrl });
    await second.connect();
    await t.owner.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    try {
      await t.owner.query('SELECT * FROM accounts WHERE id=$1', [accounts[0]]);
      if (kind === 'owner') {
        await second.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [accounts[0], family]);
      } else {
        await second.query('INSERT INTO profile_guardians VALUES($1,$2,$3,now())', [
          profile,
          family,
          accounts[0],
        ]);
      }
      await expect(
        t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [accounts[0]]),
      ).rejects.toMatchObject({ code: '40001' });
    } finally {
      await t.owner.query('ROLLBACK');
      await second.end();
    }
  });
  it.each(['insert', 'update'])('snapshot cũ không thêm giám hộ sau khi %s liên kết hồ sơ', async (kind) => {
    const { family, profile, accounts } = await t.seed();
    const second = new pg.Client({ connectionString: t.db.ownerUrl });
    await second.connect();
    await t.owner.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    try {
      await t.owner.query('SELECT * FROM accounts');
      if (kind === 'insert') {
        await second.query(
          `INSERT INTO accounts(id,display_name,family_id,family_role,health_profile_id)
           VALUES($1,'Người mới',$2,'member',$3)`,
          [randomUUID(), family, profile],
        );
      } else {
        await second.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [profile, accounts[1]]);
      }
      await expect(
        t.owner.query('INSERT INTO profile_guardians VALUES($1,$2,$3,now())', [profile, family, accounts[0]]),
      ).rejects.toMatchObject({ code: '40001' });
    } finally {
      await t.owner.query('ROLLBACK');
      await second.end();
    }
  });
});
