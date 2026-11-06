import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { painContextSchema } from '@angia/contracts';
import { painJournalHttpFixture, type PainHttpFixture } from './painJournalHttpFixture.js';
import { painJournalScenario } from './painJournalScenario.js';

describe.each([false, true])('Bối cảnh thuốc qua HTTP, self=%s', (self) => {
  let t: PainHttpFixture;
  beforeAll(async () => {
    t = await painJournalHttpFixture();
  });
  afterAll(async () => t?.stop());

  it('TC-671: mặc định đúng ba liều, một đợt giao khoảng của cùng hồ sơ và đúng hợp đồng', async () => {
    const s = await painJournalScenario(t, self);
    const sibling = await t.profile(s.familyId);
    const foreign = await t.profile();
    const issue = await s.open({ firstEntry: { level: 5, recordedAt: '2026-10-10T00:00:00Z' } });
    const courseIds: string[] = [];
    for (const person of [s, sibling, foreign]) {
      for (const startDate of ['2026-10-01', '2026-11-07']) {
        const courseId = randomUUID();
        await t.owner.query(
          `INSERT INTO medication_courses
          (id,family_id,health_profile_id,source,name,name_normalized,quantity_per_dose,slots,start_date,status)
          VALUES($1,$2,$3,'self_reported','Thuốc','thuoc',1,ARRAY['morning'],$4,'active')`,
          [courseId, person.familyId, person.profileId, startDate],
        );
        if (person === s) courseIds.push(courseId);
        if (startDate === '2026-11-07') continue;
        const days = person === s ? ['11', '12', '13'] : ['11', '12'];
        for (const day of days)
          await t.owner.query(
            `INSERT INTO as_needed_doses
            (id,family_id,health_profile_id,medication_course_id,given_at,quantity,unit)
            VALUES($1,$2,$3,$4,$5,0.5,'viên')`,
            [randomUUID(), person.familyId, person.profileId, courseId, `2026-10-${day}T00:00:00Z`],
          );
      }
    }
    const raw = await (await s.send('GET', `/${issue.id}/context`, undefined, 200)).json();
    const context = painContextSchema.parse(raw);
    expect(context).toEqual(raw);
    expect(painContextSchema.parse(context)).toEqual(context);
    expect(context.from).toBe('2026-10-10');
    expect(context.to).toBe('2026-11-06');
    expect(context.courses).toHaveLength(1);
    expect(context.courses[0]!.courseId).toBe(courseIds[0]);
    expect(context.asNeededDoses).toHaveLength(3);
    expect(context.asNeededDoses.map((d: { courseId: string }) => d.courseId)).toEqual(
      Array(3).fill(courseIds[0]),
    );
    expect(Object.keys(context).sort()).toEqual(['asNeededDoses', 'courses', 'from', 'to']);
    for (const dose of context.asNeededDoses)
      expect(Object.keys(dose).sort()).toEqual(['courseId', 'givenAt', 'name', 'quantity', 'unit']);
    expect(Object.keys(context.courses[0]!).sort()).toEqual([
      'courseId',
      'endDate',
      'name',
      'startDate',
      'status',
    ]);
  });

  it('TC-672: mặc định cắt 366 ngày; 367 ngày hoặc khoảng ngược bị từ chối', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open({ firstEntry: { level: 4, recordedAt: '2025-10-02T00:00:00Z' } });
    const raw = await (await s.send('GET', `/${issue.id}/context`, undefined, 200)).json();
    const context = painContextSchema.parse(raw);
    expect(context).toEqual(raw);
    expect(context).toMatchObject({ from: '2025-11-06', to: '2026-11-06', asNeededDoses: [], courses: [] });
    await s.send('GET', `/${issue.id}/context?from=2025-11-06&to=2026-11-06`, undefined, 200);
    for (const query of ['from=2025-11-05&to=2026-11-06', 'from=2026-11-06&to=2026-11-05']) {
      const invalid = await s.send('GET', `/${issue.id}/context?${query}`, undefined, 422);
      expect(await invalid.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
  });
});
