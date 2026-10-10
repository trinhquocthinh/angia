import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import type { NewMedicationCourse } from '../domain/MedicationCourse.js';
import { insertMedicationCourses } from './insertMedicationCourses.js';

const familyId = randomUUID();
const otherFamilyId = randomUUID();
const profileId = randomUUID();
const prescriptionId = randomUUID();
const itemId = randomUUID();
const input: NewMedicationCourse = {
  healthProfileId: profileId,
  prescriptionItemId: itemId,
  source: 'prescription',
  name: 'Amlodipin',
  nameNormalized: 'amlodipin',
  quantityPerDose: 1,
  doseUnit: null,
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: '2026-10-30',
  status: 'active',
};

// Bỏ policy/unique/FK/CHECK hoặc mở transaction riêng phải phá các hành vi kiểm chứng ở đây.
describe('Bảng đợt thuốc: RLS, ràng buộc và xóa dây chuyền', () => {
  let testDb: TestDatabase;
  let owner: pg.Client;
  let pool: pg.Pool;
  let db: Database;
  beforeAll(async () => {
    testDb = await startTestDatabase();
    await runMigrations(testDb.ownerUrl);
    owner = new pg.Client({ connectionString: testDb.ownerUrl });
    await owner.connect();
    pool = new pg.Pool({ connectionString: testDb.appUrl });
    db = createDatabase(pool);
    await owner.query(`INSERT INTO families (id, name) VALUES ($1, 'A'), ($2, 'B')`, [
      familyId,
      otherFamilyId,
    ]);
    await owner.query(`INSERT INTO health_profiles (id, family_id, display_name) VALUES ($1, $2, 'Mẹ')`, [
      profileId,
      familyId,
    ]);
    await owner.query(
      `INSERT INTO prescriptions (id, family_id, health_profile_id, issued_date, manual_without_source)
      VALUES ($1, $2, $3, '2026-10-01', true)`,
      [prescriptionId, familyId, profileId],
    );
    await owner.query(
      `INSERT INTO prescription_items (id, family_id, prescription_id, position, name, name_normalized,
      quantity_per_dose, slots, duration_days, long_term) VALUES ($1, $2, $3, 0, 'Amlodipin', 'amlodipin', 1, ARRAY['morning'], 30, false)`,
      [itemId, familyId, prescriptionId],
    );
    await withFamilyScope(db, familyId, (tx) => insertMedicationCourses(tx, familyId, [input]));
  });
  afterAll(async () => {
    await pool?.end();
    await owner?.end();
    await testDb?.container.stop();
  });

  it('role app NOBYPASSRLS: có scope A thấy đợt, scope B hoặc không scope không thấy', async () => {
    expect(
      (await pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
    expect((await pool.query('SELECT id FROM medication_courses')).rows).toEqual([]);
    const read = (id: string) => withFamilyScope(db, id, (tx) => tx.query.medicationCourses.findMany());
    expect(await read(familyId)).toHaveLength(1);
    expect(await read(otherFamilyId)).toEqual([]);
  });

  it('RLS chặn INSERT mang family_id khác scope', async () => {
    await expect(
      withFamilyScope(db, otherFamilyId, (tx) =>
        insertMedicationCourses(tx, familyId, [
          {
            ...input,
            source: 'self_reported',
            prescriptionItemId: null,
          },
        ]),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } });
  });

  it('một dòng đơn chỉ sinh một đợt và lỗi ghi không tạo thêm dòng', async () => {
    await expect(
      withFamilyScope(db, familyId, (tx) => insertMedicationCourses(tx, familyId, [input])),
    ).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'medication_courses_prescription_item_unique' },
    });
    expect((await owner.query('SELECT id FROM medication_courses')).rows).toHaveLength(1);
  });

  it('FK composite chặn hồ sơ thuộc gia đình khác ngay cả khi owner ghi', async () => {
    await expect(
      owner.query(
        `INSERT INTO medication_courses
      (id, family_id, health_profile_id, source, name, name_normalized, quantity_per_dose, slots, start_date, status)
      VALUES ($1, $2, $3, 'self_reported', 'A', 'a', 1, ARRAY['morning'], '2026-10-01', 'active')`,
        [randomUUID(), otherFamilyId, profileId],
      ),
    ).rejects.toMatchObject({ code: '23503', constraint: 'medication_courses_profile_family_fk' });
  });

  it.each([
    [0, ['morning'], '2026-10-30', 'active', 'self_reported', 'medication_courses_quantity_positive'],
    [1, [], '2026-10-30', 'active', 'self_reported', 'medication_courses_slots_valid'],
    [1, ['sang'], '2026-10-30', 'active', 'self_reported', 'medication_courses_slots_valid'],
    [1, ['morning'], '2026-09-30', 'active', 'self_reported', 'medication_courses_dates_valid'],
    [1, ['morning'], null, 'stopped', 'self_reported', 'medication_courses_terminal_has_end'],
    [1, ['morning'], '2026-10-30', 'unknown', 'self_reported', 'medication_courses_status_valid'],
    [1, ['morning'], '2026-10-30', 'active', 'prescription', 'medication_courses_has_source'],
  ])(
    'CHECK từ chối dữ liệu không hợp lệ: %s/%s/%s/%s/%s',
    async (quantity, slots, end, status, source, constraint) => {
      await expect(
        owner.query(
          `INSERT INTO medication_courses
      (id, family_id, health_profile_id, source, name, name_normalized, quantity_per_dose, slots, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, 'A', 'a', $5, $6, '2026-10-01', $7, $8)`,
          [randomUUID(), familyId, profileId, source, quantity, slots, end, status],
        ),
      ).rejects.toMatchObject({ code: '23514', constraint });
    },
  );

  it('BR-010: xóa hồ sơ xóa cả đơn, dòng thuốc và đợt', async () => {
    await owner.query('DELETE FROM health_profiles WHERE id = $1', [profileId]);
    for (const table of ['prescriptions', 'prescription_items', 'medication_courses']) {
      expect((await owner.query(`SELECT count(*) FROM ${table}`)).rows[0].count).toBe('0');
    }
  });
});
