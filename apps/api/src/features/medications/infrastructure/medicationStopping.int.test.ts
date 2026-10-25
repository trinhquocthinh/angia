import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createStoppingFixture } from '@src/shared/test/createStoppingFixture.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { lockMedicationProfile } from './lockMedicationProfile.js';
import { createMedicationRepository } from './createMedicationRepository.js';
import { stopCourse } from '../application/stopCourse.js';
describe('Dừng đợt thuốc: nguyên tử và khóa đồng thời', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-051: lỗi UPDATE và lỗi sau UPDATE đều rollback', async () => {
    const f = await createStoppingFixture(t);
    const before = await f.rows();
    await t.owner.query(
      "ALTER TABLE medication_courses ADD CONSTRAINT test_stop_failure CHECK (status <> 'stopped') NOT VALID",
    );
    try {
      expect((await f.stop()).status).toBe(500);
      expect(await f.rows()).toEqual(before);
    } finally {
      await t.owner.query('ALTER TABLE medication_courses DROP CONSTRAINT test_stop_failure');
    }
    const repository = createMedicationRepository(t.database);
    await expect(
      stopCourse(
        {
          withFamily: (family, work) =>
            repository.withFamily(family, async (store) => {
              await work(store);
              throw new Error('Lỗi sau UPDATE');
            }),
        },
        { familyId: f.familyId, profileId: f.profile.id, courseId: f.course.id, stopDate: '2026-10-05' },
        () => new Date(),
      ),
    ).rejects.toThrow('Lỗi sau UPDATE');
    expect(await f.rows()).toEqual(before);
  });
  it('TC-052: hai lệnh dừng đồng thời chỉ một thành công', async () => {
    const f = await createStoppingFixture(t);
    const responses = await Promise.all([f.stop('2026-10-05'), f.stop('2026-10-06')]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    const winner = (await responses.find((r) => r.status === 200)!.json()) as { endDate: string };
    expect(await f.rows()).toEqual([{ id: f.course.id, status: 'stopped', end_date: winner.endDate }]);
  });
  it('TC-051: dừng và thay thế đồng thời đối soát lại, không ghi đè trạng thái', async () => {
    const f = await createStoppingFixture(t);
    const replace = () =>
      t.call(f.main, 'POST', f.collection, {
        name: 'Canxi',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning'],
        startDate: '2026-10-05',
        resolution: 'replace',
        expectedConflictCourseIds: [f.course.id],
      });
    const responses = await Promise.all([f.stop(), replace()]);
    // Dừng trước: 200/409; thay thế trước: 409/201.
    expect([
      [200, 409],
      [409, 201],
    ]).toContainEqual(responses.map((r) => r.status));
    const rows = await f.rows();
    expect(rows.find((c) => c.id === f.course.id)).toMatchObject({
      status: responses[0]!.status === 200 ? 'stopped' : 'replaced',
      end_date: '2026-10-04',
    });
    expect(rows).toHaveLength(responses[1]!.status === 201 ? 2 : 1);
  });
  it('TC-051: chờ đúng khóa hồ sơ của luồng lưu đơn trước khi đọc trạng thái', async () => {
    const f = await createStoppingFixture(t);
    let release: () => void = () => undefined;
    let ready: () => void = () => undefined;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const acquired = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const holder = withFamilyScope(t.database, f.familyId, async (tx) => {
      await lockMedicationProfile(tx, f.familyId, f.profile.id);
      ready();
      await wait;
    });
    await acquired;
    try {
      const stopping = f.stop();
      let blocked = false;
      for (let attempt = 0; attempt < 100 && !blocked; attempt++) {
        blocked =
          (await t.owner.query("SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted"))
            .rowCount !== 0;
        if (!blocked) await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blocked).toBe(true);
      expect((await f.rows())[0].status).toBe('active');
      release();
      await holder;
      expect((await stopping).status).toBe(200);
    } finally {
      release();
      await holder;
    }
  });
});
