import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

describe('Ràng buộc sổ đau nhức (Tech Spec §3.10.1)', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  const familyId = randomUUID();
  const otherFamilyId = randomUUID();
  const otherProfileId = randomUUID();
  const otherIssueId = randomUUID();

  const insertIssue = (profileId: string, status = 'tracking') =>
    owner.query<{ id: string }>(
      `INSERT INTO pain_issues(id,family_id,health_profile_id,region,side,status,resolved_on)
       VALUES($1,$2,$3,'knee','left',$4,CASE WHEN $4 = 'resolved' THEN '2026-11-05'::date END) RETURNING id`,
      [randomUUID(), familyId, profileId, status],
    );

  const newJournal = async () => {
    const profileId = randomUUID();
    const actorId = randomUUID();
    await owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Mẹ')", [
      profileId,
      familyId,
    ]);
    await owner.query(
      `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role)
       VALUES($1::uuid,$1::text,'Người ghi',$2,'member')`,
      [actorId, familyId],
    );
    const issueId = (await insertIssue(profileId)).rows[0]!.id;
    await owner.query(
      'UPDATE pain_issues SET created_by_account_id=$1,updated_by_account_id=$1 WHERE id=$2',
      [actorId, issueId],
    );
    await owner.query(
      `INSERT INTO pain_entries(id,family_id,health_profile_id,pain_issue_id,level,recorded_at,created_by_account_id,updated_by_account_id)
       VALUES($1,$2,$3,$4,5,'2026-11-05T01:00:00Z',$5,$5)`,
      [randomUUID(), familyId, profileId, issueId, actorId],
    );
    await owner.query(
      `INSERT INTO exercise_notes(id,family_id,health_profile_id,pain_issue_id,name,source,start_date,created_by_account_id,updated_by_account_id)
       VALUES($1,$2,$3,$4,'Bài tập','self','2026-11-05',$5,$5)`,
      [randomUUID(), familyId, profileId, issueId, actorId],
    );
    await owner.query(
      `INSERT INTO pain_issue_status_events(id,family_id,health_profile_id,pain_issue_id,kind,on_date,actor_account_id)
       VALUES($1,$2,$3,$4,'reopened','2026-11-05',$5)`,
      [randomUUID(), familyId, profileId, issueId, actorId],
    );
    return { profileId, issueId, actorId };
  };

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà A'),($2,'Nhà B')", [
      familyId,
      otherFamilyId,
    ]);
    await owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Bố')", [
      otherProfileId,
      otherFamilyId,
    ]);
  });

  afterAll(async () => {
    await owner?.end();
    await db?.container.stop();
  });
  it('BR-058: chỉ một tracking mỗi vùng/bên/hồ sơ; resolved được trùng, mở lại và sửa vùng vẫn kiểm unique', async () => {
    const { profileId, issueId } = await newJournal();
    await expect(insertIssue(profileId)).rejects.toMatchObject({
      code: '23505',
      constraint: 'pain_issues_tracking_region_unique',
    });
    const resolved = (await insertIssue(profileId, 'resolved')).rows[0]!.id;
    await insertIssue(profileId, 'resolved');
    await expect(
      owner.query("UPDATE pain_issues SET status='tracking',resolved_on=NULL WHERE id=$1", [resolved]),
    ).rejects.toMatchObject({ code: '23505' });
    await owner.query("UPDATE pain_issues SET side='right' WHERE id=$1", [resolved]);
    await owner.query("UPDATE pain_issues SET status='tracking',resolved_on=NULL WHERE id=$1", [resolved]);
    await expect(
      owner.query("UPDATE pain_issues SET side='left' WHERE id=$1", [resolved]),
    ).rejects.toMatchObject({ code: '23505' });
    await owner.query('DELETE FROM pain_issues WHERE id=$1', [issueId]);
    await insertIssue(profileId);
  });
  it.each([
    ['pain_issues', "side='khác'", 'pain_issues_side_valid'],
    ['pain_issues', "status='khác'", 'pain_issues_status_valid'],
    ['pain_issues', "status='resolved'", 'pain_issues_resolved_on_valid'],
    ['pain_issues', "resolved_on='2026-11-05'", 'pain_issues_resolved_on_valid'],
    ['pain_issues', "title=repeat('a',61)", 'pain_issues_title_length'],
    ['pain_entries', 'level=0', 'pain_entries_level_range'],
    ['pain_entries', 'level=11', 'pain_entries_level_range'],
    ['pain_entries', "note=repeat('a',501)", 'pain_entries_note_length'],
    ['exercise_notes', "source='khác'", 'exercise_notes_source_valid'],
    ['exercise_notes', "prescriber='Người chỉ định'", 'exercise_notes_prescriber_source_valid'],
    ['exercise_notes', "end_date='2026-11-04'", 'exercise_notes_dates_valid'],
    ['exercise_notes', "name=''", 'exercise_notes_name_length'],
    ['exercise_notes', "name=repeat('a',101)", 'exercise_notes_name_length'],
    ['exercise_notes', "source='prescribed',prescriber=repeat('a',101)", 'exercise_notes_prescriber_length'],
    ['exercise_notes', "note=repeat('a',1001)", 'exercise_notes_note_length'],
    ['pain_issue_status_events', "kind='khác'", 'pain_issue_status_events_kind_valid'],
  ])('%s chặn %s bằng CHECK %s', async (table, change, constraint) => {
    const { profileId } = await newJournal();
    await expect(
      owner.query(`UPDATE ${table} SET ${change} WHERE health_profile_id=$1`, [profileId]),
    ).rejects.toMatchObject({ code: '23514', constraint });
  });
  it('SDD §2.4: nhận đúng các biên độ dài, mức đau và ngày; mã vùng không bị CHECK ở DB', async () => {
    const { profileId } = await newJournal();
    await owner.query(
      "UPDATE pain_issues SET title=repeat('a',60),region='future_region' WHERE health_profile_id=$1",
      [profileId],
    );
    for (const level of [1, 10]) {
      await owner.query("UPDATE pain_entries SET level=$1,note=repeat('a',500) WHERE health_profile_id=$2", [
        level,
        profileId,
      ]);
    }
    await owner.query(
      `UPDATE exercise_notes SET name=repeat('a',100),source='prescribed',prescriber=repeat('a',100),
       note=repeat('a',1000),end_date=start_date WHERE health_profile_id=$1`,
      [profileId],
    );
    await owner.query("UPDATE pain_issue_status_events SET kind='resolved' WHERE health_profile_id=$1", [
      profileId,
    ]);
  });
  it.each(['pain_issues', 'pain_entries', 'exercise_notes', 'pain_issue_status_events'])(
    '%s: FK ghép chặn hồ sơ khác gia đình',
    async (table) => {
      const { profileId } = await newJournal();
      await expect(
        owner.query(`UPDATE ${table} SET health_profile_id=$1 WHERE health_profile_id=$2`, [
          otherProfileId,
          profileId,
        ]),
      ).rejects.toMatchObject({ code: '23503' });
    },
  );
  it('FK ghép của cả ba bảng con chặn vấn đề khác gia đình', async () => {
    await owner.query(
      `INSERT INTO pain_issues(id,family_id,health_profile_id,region,side,status)
       VALUES($1,$2,$3,'knee','left','tracking')`,
      [otherIssueId, otherFamilyId, otherProfileId],
    );
    const { profileId } = await newJournal();
    for (const table of ['pain_entries', 'exercise_notes', 'pain_issue_status_events']) {
      await expect(
        owner.query(`UPDATE ${table} SET pain_issue_id=$1 WHERE health_profile_id=$2`, [
          otherIssueId,
          profileId,
        ]),
      ).rejects.toMatchObject({ code: '23503' });
    }
  });
  it.each(['pain_issues', 'health_profiles'])(
    'BR-010/064: xóa %s xóa dây chuyền sổ đau nhức',
    async (table) => {
      const { profileId, issueId } = await newJournal();
      await owner.query(`DELETE FROM ${table} WHERE id=$1`, [table === 'pain_issues' ? issueId : profileId]);
      for (const child of ['pain_issues', 'pain_entries', 'exercise_notes', 'pain_issue_status_events']) {
        expect(
          (await owner.query(`SELECT id FROM ${child} WHERE health_profile_id=$1`, [profileId])).rows,
        ).toEqual([]);
      }
    },
  );

  it('BR-062: role app ghi được phạm vi gia đình và tự quản; RLS chặn đọc/ghi hồ sơ khác', async () => {
    const own = await newJournal();
    const sibling = await newJournal();
    const app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
    try {
      for (const table of ['pain_issues', 'pain_entries', 'exercise_notes', 'pain_issue_status_events']) {
        await app.query('BEGIN');
        await app.query("SELECT set_config('app.family_id',$1,true)", [familyId]);
        const filter = 'WHERE health_profile_id IN ($1,$2)';
        const profiles = [own.profileId, sibling.profileId];
        expect(
          (await app.query(`UPDATE ${table} SET health_profile_id=health_profile_id ${filter}`, profiles))
            .rowCount,
        ).toBe(2);
        await app.query("SELECT set_config('app.self_profile_id',$1,true)", [own.profileId]);
        expect((await app.query(`SELECT health_profile_id FROM ${table} ${filter}`, profiles)).rows).toEqual([
          { health_profile_id: own.profileId },
        ]);
        expect(
          (
            await app.query(
              `UPDATE ${table} SET health_profile_id=health_profile_id WHERE health_profile_id=$1`,
              [sibling.profileId],
            )
          ).rowCount,
        ).toBe(0);
        expect(
          (
            await app.query(
              `UPDATE ${table} SET health_profile_id=health_profile_id WHERE health_profile_id=$1`,
              [own.profileId],
            )
          ).rowCount,
        ).toBe(1);
        await expect(
          app.query(`UPDATE ${table} SET health_profile_id=$2 WHERE health_profile_id=$1`, profiles),
        ).rejects.toMatchObject({ code: '42501' });
        await app.query('ROLLBACK');
      }
    } finally {
      await app.query('ROLLBACK');
      await app.end();
    }
  });

  it('BR-062: xóa tài khoản giữ dữ liệu, đặt người tạo/sửa và actor về NULL', async () => {
    const { profileId, actorId } = await newJournal();
    await owner.query('DELETE FROM accounts WHERE id=$1', [actorId]);
    for (const table of ['pain_issues', 'pain_entries', 'exercise_notes']) {
      expect(
        (
          await owner.query(
            `SELECT created_by_account_id,updated_by_account_id FROM ${table} WHERE health_profile_id=$1`,
            [profileId],
          )
        ).rows,
      ).toEqual([{ created_by_account_id: null, updated_by_account_id: null }]);
    }
    expect(
      (
        await owner.query(
          'SELECT actor_account_id FROM pain_issue_status_events WHERE health_profile_id=$1',
          [profileId],
        )
      ).rows,
    ).toEqual([{ actor_account_id: null }]);
  });
});
