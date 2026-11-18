import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHouseholdDatabase } from '@src/shared/test/startHouseholdDatabase.js';

describe('E27-S2-T1: ràng buộc Chủ hộ và người giám hộ', () => {
  let t: Awaited<ReturnType<typeof startHouseholdDatabase>>;
  beforeAll(async () => {
    t = await startHouseholdDatabase();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('cho phép nhà cũ chưa có Chủ hộ, giữ giá trị sau khi đã gán', async () => {
    const { family, accounts } = await t.seed();
    const before = await t.owner.query('SELECT * FROM families WHERE id=$1', [family]);
    expect(before.rows[0]).toHaveProperty('owner_account_id', null);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [accounts[0], family]);
    await expect(
      t.owner.query('UPDATE families SET owner_account_id=NULL WHERE id=$1', [family]),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('Chủ hộ phải là main cùng nhà; không thể hạ vai trò, rời hoặc xoá tài khoản Chủ hộ', async () => {
    const a = await t.seed();
    const b = await t.seed();
    await expect(
      t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [b.accounts[0], a.family]),
    ).rejects.toMatchObject({ code: '23514' });
    await t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [a.accounts[1]]);
    await expect(
      t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [a.accounts[1], a.family]),
    ).rejects.toMatchObject({ code: '23514' });
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [a.accounts[0], a.family]);
    for (const query of [
      "UPDATE accounts SET family_role='member' WHERE id=$1",
      'UPDATE accounts SET family_id=NULL WHERE id=$1',
      'DELETE FROM accounts WHERE id=$1',
    ])
      await expect(t.owner.query(query, [a.accounts[0]])).rejects.toMatchObject({
        code: expect.stringMatching(/^23/),
      });
  });

  it('chuyển Chủ hộ và cập nhật tài khoản trong cùng transaction kiểm trạng thái cuối', async () => {
    const { family, accounts } = await t.seed();
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [accounts[0], family]);
    await t.owner.query('BEGIN');
    try {
      await t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [accounts[0]]);
      await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [accounts[1], family]);
      await t.owner.query('COMMIT');
    } finally {
      await t.owner.query('ROLLBACK');
    }
    expect(
      (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [family])).rows[0],
    ).toEqual({ owner_account_id: accounts[1] });
  });

  it('người giám hộ phải main cùng nhà và hồ sơ phải vị thành niên không liên kết', async () => {
    const a = await t.seed();
    const b = await t.seed();
    const insert = (account: string) =>
      t.owner.query(
        'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
        [a.profile, a.family, account],
      );
    await expect(insert(b.accounts[0]!)).rejects.toMatchObject({ code: expect.stringMatching(/^23/) });
    await t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [a.accounts[1]]);
    await expect(insert(a.accounts[1]!)).rejects.toMatchObject({ code: '23514' });
    await t.owner.query('UPDATE health_profiles SET birth_year=1980 WHERE id=$1', [a.profile]);
    await expect(insert(a.accounts[0]!)).rejects.toMatchObject({ code: '23514' });
    await t.owner.query('UPDATE health_profiles SET birth_year=2020 WHERE id=$1', [a.profile]);
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [a.profile, a.accounts[0]]);
    await expect(insert(a.accounts[0]!)).rejects.toMatchObject({ code: '23514' });
  });

  it('tối đa hai người giám hộ; không gỡ hoặc hạ vai trò người cuối cùng', async () => {
    const { family, profile, accounts } = await t.seed();
    for (const id of accounts.slice(0, 2))
      await t.owner.query(
        'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
        [profile, family, id],
      );
    await expect(
      t.owner.query(
        'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
        [profile, family, accounts[2]],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await t.owner.query('DELETE FROM profile_guardians WHERE account_id=$1', [accounts[1]]);
    await expect(
      t.owner.query('DELETE FROM profile_guardians WHERE account_id=$1', [accounts[0]]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [accounts[0]]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [profile, accounts[1]]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      t.owner.query('UPDATE health_profiles SET birth_year=1980 WHERE id=$1', [profile]),
    ).rejects.toMatchObject({ code: '23514' });
    await t.owner.query('DELETE FROM health_profiles WHERE id=$1', [profile]);
    expect(
      (await t.owner.query('SELECT * FROM profile_guardians WHERE health_profile_id=$1', [profile])).rows,
    ).toEqual([]);
  });
  it('hai transaction thêm đồng thời không tạo người giám hộ thứ ba', async () => {
    const { family, profile, accounts } = await t.seed();
    await t.owner.query('INSERT INTO profile_guardians VALUES($1,$2,$3,now())', [
      profile,
      family,
      accounts[0],
    ]);
    const second = new pg.Client({ connectionString: t.db.ownerUrl });
    await second.connect();
    try {
      const results = await Promise.allSettled(
        [t.owner, second].map((client, index) =>
          client.query('INSERT INTO profile_guardians VALUES($1,$2,$3,now())', [
            profile,
            family,
            accounts[index + 1],
          ]),
        ),
      );
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
      expect(
        (
          await t.owner.query(
            'SELECT count(*)::int AS total FROM profile_guardians WHERE health_profile_id=$1',
            [profile],
          )
        ).rows,
      ).toEqual([{ total: 2 }]);
    } finally {
      await second.end();
    }
  });

  it('chặn liên kết qua INSERT tài khoản mới vào hồ sơ đã có người giám hộ', async () => {
    const { family, profile, accounts } = await t.seed();
    await t.owner.query('INSERT INTO profile_guardians VALUES($1,$2,$3,now())', [
      profile,
      family,
      accounts[0],
    ]);
    await expect(
      t.owner.query(
        `INSERT INTO accounts(id,display_name,family_id,family_role,health_profile_id)
       VALUES($1,'Người mới',$2,'member',$3)`,
        [randomUUID(), family, profile],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
