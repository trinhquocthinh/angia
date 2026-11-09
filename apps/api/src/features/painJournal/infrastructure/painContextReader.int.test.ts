import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { painContextSchema } from '@angia/contracts';
import { getPainContext } from '../application/getPainContext.js';
import {
  painNow,
  painRepositoryFixture,
  unwrapPain,
  type PainRepositoryFixture,
} from './painRepositoryFixture.js';

describe('Bối cảnh thuốc scoped', () => {
  let t: PainRepositoryFixture;
  beforeAll(async () => {
    t = await painRepositoryFixture();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-670/671: biên ngày VN, đợt giao khoảng, null endDate và không ẩn hồ sơ tắt số đo', async () => {
    const session = await t.profile();
    const sibling = await t.profile(session.familyId);
    const foreign = await t.profile();
    const issue = await t.open(session);
    const courses: string[] = [];
    for (const person of [session, sibling, foreign]) {
      for (const [start, end] of [
        ['2026-11-01', null],
        ['2026-11-06', '2026-11-06'],
        ['2026-11-07', null],
        ['2026-11-01', '2026-11-05'],
      ]) {
        const id = randomUUID();
        await t.owner.query(
          `INSERT INTO medication_courses(id,family_id,health_profile_id,source,name,name_normalized,
           quantity_per_dose,slots,start_date,end_date,status)
           VALUES($1,$2,$3,'self_reported','Thuốc','thuoc',1,ARRAY['morning'],$4,$5,'active')`,
          [id, person.familyId, person.profileId, start, end],
        );
        if (person === session) courses.push(id);
        for (const givenAt of [
          '2026-11-05T16:59:59.999Z',
          '2026-11-05T17:00:00Z',
          '2026-11-06T16:59:59.999Z',
          '2026-11-06T17:00:00Z',
        ]) {
          await t.owner.query(
            `INSERT INTO as_needed_doses(id,family_id,health_profile_id,medication_course_id,given_at,quantity,unit)
             VALUES($1,$2,$3,$4,$5,0.5,'viên')`,
            [randomUUID(), person.familyId, person.profileId, id, givenAt],
          );
        }
      }
    }
    await t.owner.query('UPDATE health_profiles SET vitals_enabled=false WHERE id=$1', [session.profileId]);
    const result = unwrapPain(
      await getPainContext(
        t.self(session.profileId),
        { ...session, issueId: issue.id },
        { from: '2026-11-06', to: '2026-11-06' },
        painNow,
      ),
    );
    expect(painContextSchema.parse(result)).toEqual(result);
    expect(result.courses.map((c) => c.courseId).sort()).toEqual(courses.slice(0, 2).sort());
    expect(result.asNeededDoses).toHaveLength(8);
    expect(result.asNeededDoses.every((d) => courses.includes(d.courseId) && d.quantity === 0.5)).toBe(true);
    expect([...new Set(result.asNeededDoses.map((d) => d.givenAt))].sort()).toEqual([
      '2026-11-05T17:00:00.000Z',
      '2026-11-06T16:59:59.999Z',
    ]);
    const first = await t.repository.withFamily(session.familyId, (store) =>
      store.firstRecordedAt(session.profileId, issue.id),
    );
    expect(first).toBe('2026-11-05T17:00:00.000Z');
  });
});
