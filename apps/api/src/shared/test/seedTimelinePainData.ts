import { randomUUID } from 'node:crypto';
import type { ProfileTestApp } from './startProfileTestApp.js';

// TC-715: 2 lần ghi (một lần qua nửa đêm UTC→VN), đóng, mở lại, 1 bài tập.
export async function seedTimelinePainData(t: ProfileTestApp, f: { familyId: string; profileId: string }) {
  const [issueId, earlyEntryId, lateEntryId, resolvedId, reopenedId, exerciseId] = Array.from(
    { length: 6 },
    () => randomUUID(),
  );
  const scope = [f.familyId, f.profileId, issueId];
  await t.owner.query(
    `INSERT INTO pain_issues(id,family_id,health_profile_id,region,side,status)
     VALUES ($3,$1,$2,'knee','left','tracking')`,
    scope,
  );
  await t.owner.query(
    `INSERT INTO pain_entries(id,family_id,health_profile_id,pain_issue_id,level,recorded_at,note)
     VALUES ($4,$1,$2,$3,4,'2026-10-29T17:30:59Z',NULL),($5,$1,$2,$3,6,'2026-10-31T03:15:00Z','Sau khi leo cầu thang')`,
    [...scope, earlyEntryId, lateEntryId],
  );
  await t.owner.query(
    `INSERT INTO pain_issue_status_events(id,family_id,health_profile_id,pain_issue_id,kind,on_date)
     VALUES ($4,$1,$2,$3,'resolved','2026-10-31'),($5,$1,$2,$3,'reopened','2026-11-01')`,
    [...scope, resolvedId, reopenedId],
  );
  await t.owner.query(
    `INSERT INTO exercise_notes(id,family_id,health_profile_id,pain_issue_id,name,source,prescriber,start_date)
     VALUES ($4,$1,$2,$3,'Duỗi gối','prescribed','BS. Lan','2026-10-30')`,
    [...scope, exerciseId],
  );
  return {
    issueId: issueId!,
    earlyEntryId: earlyEntryId!,
    lateEntryId: lateEntryId!,
    resolvedId: resolvedId!,
    reopenedId: reopenedId!,
    exerciseId: exerciseId!,
  };
}
