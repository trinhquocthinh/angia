import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startHouseholdDatabase } from '@src/shared/test/startHouseholdDatabase.js';
import { seedV1FamilyOwners } from '@src/shared/test/seedV1FamilyOwners.js';

const execute = promisify(execFile);
const script = fileURLToPath(new URL('../../../../scripts/ops/v1FamilyOwners.ts', import.meta.url));

describe('E27-S6-T1: chuyển đổi Chủ hộ qua CLI thật', () => {
  let t: Awaited<ReturnType<typeof startHouseholdDatabase>>;
  let seed: Awaited<ReturnType<typeof seedV1FamilyOwners>>;
  let directory: string;
  let owners: Record<string, string>;
  let creators: Record<string, string>;
  const run = async (args: string[] = [], url?: string) => {
    await writeFile(join(directory, 'owners.json'), JSON.stringify(owners));
    await writeFile(join(directory, 'creators.json'), JSON.stringify(creators));
    return execute(
      process.execPath,
      [
        '--import',
        'tsx',
        script,
        '--env',
        'test',
        '--mapping',
        join(directory, 'owners.json'),
        '--creators',
        join(directory, 'creators.json'),
        ...args,
      ],
      {
        env: { ...process.env, DATABASE_OWNER_URL: url ?? t.db.ownerUrl },
        timeout: 30_000,
      },
    );
  };
  const snapshot = async () =>
    (
      await t.owner.query(`SELECT
    (SELECT jsonb_agg(to_jsonb(f) ORDER BY id) FROM families f) AS families,
    (SELECT jsonb_agg(to_jsonb(g) ORDER BY health_profile_id,account_id) FROM profile_guardians g) AS guardians,
    (SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM health_profiles p) AS profiles,
    (SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM accounts a) AS accounts`)
    ).rows;

  beforeAll(async () => {
    t = await startHouseholdDatabase();
    directory = await mkdtemp(join(tmpdir(), 'angia-family-owners-'));
  });
  beforeEach(async () => {
    await t.owner.query('TRUNCATE families, accounts CASCADE');
    seed = await seedV1FamilyOwners(t.owner);
    owners = Object.fromEntries(seed.map((s) => [s.family, s.owner]));
    creators = Object.fromEntries(seed.map((s) => [s.profile, s.creator]));
  });
  afterAll(async () => {
    await t?.stop();
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it('TC-815: đủ ba nhà, chọn đúng giám hộ và giữ số đếm sáu bảng', async () => {
    const { stdout } = await run();
    const report = JSON.parse(stdout);
    expect(report).toMatchObject({ mode: 'apply', ownersUpdated: 3, guardiansInserted: 3 });
    expect(report.before).toEqual(report.after);
    for (const counts of Object.values(report.before))
      expect(counts).toEqual({
        health_profiles: 1,
        medication_courses: 1,
        reminders: 1,
        dose_confirmations: 1,
        source_documents: 1,
        extractions: 1,
        family_scan_quotas: 1,
        ocr_operations: 1,
      });
    expect((await t.owner.query('SELECT id,owner_account_id FROM families ORDER BY id')).rows).toEqual(
      seed.map((s) => ({ id: s.family, owner_account_id: s.owner })).sort((a, b) => a.id.localeCompare(b.id)),
    );
    const guardians = (await t.owner.query('SELECT health_profile_id,account_id FROM profile_guardians'))
      .rows;
    expect(guardians).toHaveLength(3);
    for (const [index, s] of seed.entries())
      expect(guardians).toContainEqual({
        health_profile_id: s.profile,
        account_id: index === 0 ? s.creator : s.owner,
      });
  });

  it('TC-816: thiếu một nhà thì dừng, không đổi gì', async () => {
    const before = await snapshot();
    delete owners[seed[1]!.family];
    await expect(run()).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('đủ các nhà') });
    expect(await snapshot()).toEqual(before);
  });

  it('TC-817: Chủ hộ là member hoặc main nhà khác đều bị từ chối', async () => {
    const before = await snapshot();
    for (const id of [seed[1]!.creator, seed[0]!.owner]) {
      owners[seed[1]!.family] = id;
      await expect(run()).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('main cùng nhà'),
      });
      expect(await snapshot()).toEqual(before);
    }
  });

  it('TC-818: lần hai không ghi thêm, giữ cả created_at của giám hộ', async () => {
    await run();
    const before = await snapshot();
    const report = JSON.parse((await run()).stdout);
    expect(report).toMatchObject({ ownersUpdated: 0, guardiansInserted: 0 });
    expect(await snapshot()).toEqual(before);
  });

  it('TC-815: dry-run kiểm đầy đủ rồi rollback cả Chủ hộ và giám hộ', async () => {
    const before = await snapshot();
    const report = JSON.parse((await run(['--dry-run'])).stdout);
    expect(report).toMatchObject({ mode: 'dry-run', ownersUpdated: 3, guardiansInserted: 3 });
    expect(report.before).toEqual(report.after);
    expect(await snapshot()).toEqual(before);
  });

  it('TC-816: thiếu căn cứ người tạo hoặc có hồ sơ thừa thì dừng', async () => {
    const before = await snapshot();
    delete creators[seed[0]!.profile];
    await expect(run()).rejects.toMatchObject({ code: 1 });
    expect(await snapshot()).toEqual(before);
    creators[seed[0]!.profile] = seed[0]!.creator;
    creators[seed[0]!.family] = seed[0]!.creator;
    await expect(run()).rejects.toMatchObject({ code: 1 });
    expect(await snapshot()).toEqual(before);
  });

  it('TC-818: khác Chủ hộ hoặc giám hộ đã gán thì dừng thay vì ghi đè', async () => {
    await run();
    const before = await snapshot();
    owners[seed[0]!.family] = seed[0]!.creator;
    await expect(run()).rejects.toMatchObject({ code: 1 });
    expect(await snapshot()).toEqual(before);
    owners[seed[0]!.family] = seed[0]!.owner;
    creators[seed[0]!.profile] = seed[0]!.owner;
    await expect(run()).rejects.toMatchObject({ code: 1 });
    expect(await snapshot()).toEqual(before);
  });

  it('TC-815: role runtime và --env sai không thể chạy chuyển đổi', async () => {
    const before = await snapshot();
    await expect(run([], t.db.appUrl)).rejects.toMatchObject({ code: 1 });
    await expect(run(['--env', 'sit'])).rejects.toMatchObject({ code: 1 });
    expect(await snapshot()).toEqual(before);
  });

  it('TC-815: sai lệch số đếm do trigger làm rollback toàn bộ', async () => {
    const before = await snapshot();
    await t.owner.query(`CREATE FUNCTION public.ops_test_count_drift() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN DELETE FROM extractions; RETURN NEW; END $$;
      CREATE TRIGGER ops_test_count_drift AFTER UPDATE OF owner_account_id ON families
      FOR EACH ROW EXECUTE FUNCTION public.ops_test_count_drift()`);
    try {
      await expect(run()).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('Đối chiếu') });
      expect(await snapshot()).toEqual(before);
      expect((await t.owner.query('SELECT count(*)::int AS total FROM extractions')).rows).toEqual([
        { total: 3 },
      ]);
    } finally {
      await t.owner.query(
        'DROP TRIGGER ops_test_count_drift ON families; DROP FUNCTION public.ops_test_count_drift()',
      );
    }
  });

  it('TC-815: trigger bỏ qua cập nhật Chủ hộ không được báo thành công', async () => {
    const before = await snapshot();
    await t.owner.query(`CREATE FUNCTION public.ops_test_skip_owner() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$;
      CREATE TRIGGER ops_test_skip_owner BEFORE UPDATE OF owner_account_id ON families
      FOR EACH ROW EXECUTE FUNCTION public.ops_test_skip_owner()`);
    try {
      await expect(run()).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('chưa hoàn tất'),
      });
      expect(await snapshot()).toEqual(before);
    } finally {
      await t.owner.query(
        'DROP TRIGGER ops_test_skip_owner ON families; DROP FUNCTION public.ops_test_skip_owner()',
      );
    }
  });

  it('TC-815: tuổi theo năm Việt Nam, bỏ qua người lớn và hồ sơ đã liên kết', async () => {
    const s = seed[0]!;
    await t.owner.query(
      `INSERT INTO health_profiles(id,family_id,display_name,birth_year) VALUES
      (gen_random_uuid(),$1,'Đủ 18 tuổi',extract(year FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int-18),
      (gen_random_uuid(),$1,'Không rõ năm sinh',NULL)`,
      [s.family],
    );
    await t.owner.query(
      `UPDATE health_profiles SET birth_year =
      extract(year FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int-17 WHERE id=$1`,
      [s.profile],
    );
    const linked = seed[1]!;
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [
      linked.profile,
      linked.creator,
    ]);
    delete creators[linked.profile];
    const before = await snapshot();
    const report = JSON.parse((await run()).stdout);
    expect(report.guardiansInserted).toBe(2);
    const after = await snapshot();
    expect(after[0].profiles).toEqual(before[0].profiles);
    expect(after[0].accounts).toEqual(before[0].accounts);
    expect(
      (
        await t.owner.query('SELECT account_id FROM profile_guardians WHERE health_profile_id=$1', [
          s.profile,
        ])
      ).rows,
    ).toEqual([{ account_id: s.creator }]);
  });

  it('TC-815: đổi giá trị lượt nhưng giữ nguyên số dòng cũng rollback', async () => {
    const before = await snapshot();
    await t.owner.query(`CREATE FUNCTION public.ops_test_quota_drift() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN UPDATE family_scan_quotas SET used_scans=used_scans+1; RETURN NEW; END $$;
      CREATE TRIGGER ops_test_quota_drift AFTER UPDATE OF owner_account_id ON families
      FOR EACH ROW EXECUTE FUNCTION public.ops_test_quota_drift()`);
    try {
      await expect(run()).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('Đối chiếu') });
      expect(await snapshot()).toEqual(before);
      expect((await t.owner.query('SELECT DISTINCT used_scans FROM family_scan_quotas')).rows).toEqual([
        { used_scans: '2' },
      ]);
    } finally {
      await t.owner.query(
        'DROP TRIGGER ops_test_quota_drift ON families; DROP FUNCTION public.ops_test_quota_drift()',
      );
    }
  });
});
