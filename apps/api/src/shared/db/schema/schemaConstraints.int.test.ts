import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

// Ràng buộc cưỡng chế ở DB theo ERD §2; chạy bằng role owner (không chịu RLS) để chỉ kiểm ràng buộc.
describe('Ràng buộc lược đồ Walking Skeleton', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  const familyId = randomUUID();
  const otherFamilyId = randomUUID();
  const profileId = randomUUID();
  const accountId = randomUUID();
  const batchId = randomUUID();
  const documentId = randomUUID();

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    await owner.query(`INSERT INTO families (id, name) VALUES ($1, 'Nhà A'), ($2, 'Nhà B')`, [
      familyId,
      otherFamilyId,
    ]);
    await owner.query(`INSERT INTO health_profiles (id, family_id, display_name) VALUES ($1, $2, 'Mẹ')`, [
      profileId,
      familyId,
    ]);
    await owner.query(
      `INSERT INTO accounts (id, oidc_subject, display_name, family_id, family_role) VALUES ($1, 'sub-1', 'Thịnh', $2, 'main')`,
      [accountId, familyId],
    );
    await owner.query(
      `INSERT INTO upload_batches (id, family_id, health_profile_id, created_by) VALUES ($1, $2, $3, $4)`,
      [batchId, familyId, profileId, accountId],
    );
    await owner.query(
      `INSERT INTO source_documents (id, family_id, health_profile_id, batch_id, status, original_key, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, 'uploaded', 'k', 'image/jpeg', 10)`,
      [documentId, familyId, profileId, batchId],
    );
  });

  afterAll(async () => {
    await owner?.end();
    await db?.container.stop();
  });

  const insertMeasurement = (columns: string, values: string) =>
    owner.query(
      `INSERT INTO measurements (id, family_id, health_profile_id, measured_on, ${columns})
       VALUES ($1, $2, $3, '2026-10-01', ${values})`,
      [randomUUID(), familyId, profileId],
    );

  it('id UUIDv7 do ứng dụng cấp: chèn thiếu id bị từ chối', async () => {
    await expect(owner.query(`INSERT INTO families (name) VALUES ('Thiếu id')`)).rejects.toThrow(
      /null value/,
    );
  });

  it('BR-002: chặn đổi family_id của hồ sơ sức khỏe', async () => {
    await expect(
      owner.query(`UPDATE health_profiles SET family_id = $1 WHERE id = $2`, [otherFamilyId, profileId]),
    ).rejects.toThrow(/BR-002/);
    await expect(
      owner.query(`UPDATE health_profiles SET display_name = 'Mẹ Hoa' WHERE id = $1`, [profileId]),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it('BR-008: một tài khoản gắn tối đa một hồ sơ, một hồ sơ gắn tối đa một tài khoản', async () => {
    await owner.query(`UPDATE accounts SET health_profile_id = $1 WHERE id = $2`, [profileId, accountId]);
    await expect(
      owner.query(
        `INSERT INTO accounts (id, oidc_subject, display_name, health_profile_id) VALUES ($1, 'sub-2', 'Lan', $2)`,
        [randomUUID(), profileId],
      ),
    ).rejects.toThrow(/accounts_health_profile_id_unique/);
  });

  it('tài khoản chờ vào nhóm được phép chưa có family_id và family_role', async () => {
    await expect(
      owner.query(`INSERT INTO accounts (id, oidc_subject, display_name) VALUES ($1, 'sub-3', 'Chờ')`, [
        randomUUID(),
      ]),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it('TC-088 (BR-015): UPDATE trực tiếp sang approved khi chưa có ngày bị CHECK từ chối', async () => {
    await expect(
      owner.query(`UPDATE source_documents SET status = 'approved' WHERE id = $1`, [documentId]),
    ).rejects.toThrow(/source_documents_approved_has_date/);
  });

  it('BR-014: số đo phải có chứng từ gốc hoặc cờ nhập tay', async () => {
    await expect(insertMeasurement('kind, systolic, diastolic', `'blood_pressure', 130, 80`)).rejects.toThrow(
      /measurements_has_source/,
    );
    await expect(
      insertMeasurement(
        'kind, systolic, diastolic, manual_without_source',
        `'blood_pressure', 130, 80, true`,
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it('BR-019: huyết áp bắt buộc đủ 2 trị số và tâm thu lớn hơn tâm trương', async () => {
    await expect(
      insertMeasurement('kind, systolic, diastolic, manual_without_source', `'blood_pressure', 80, 80, true`),
    ).rejects.toThrow(/measurements_blood_pressure_valid/);
    await expect(
      insertMeasurement('kind, systolic, manual_without_source', `'blood_pressure', 130, true`),
    ).rejects.toThrow(/measurements_blood_pressure_valid/);
  });

  it('BR-020: đường huyết bắt buộc có giá trị và đơn vị mmol/L hoặc mg/dL', async () => {
    await expect(
      insertMeasurement(
        'kind, glucose_value, glucose_unit, manual_without_source',
        `'blood_glucose', 6.1, 'mmol', true`,
      ),
    ).rejects.toThrow(/measurements_blood_glucose_valid/);
    await expect(
      insertMeasurement(
        'kind, glucose_value, glucose_unit, manual_without_source',
        `'blood_glucose', 110, 'mg/dL', true`,
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it('BR-025/BR-014: dòng thuốc thiếu số ngày khi không dài hạn, đơn/xét nghiệm không có nguồn bị từ chối', async () => {
    const prescriptionId = randomUUID();
    await expect(
      owner.query(
        `INSERT INTO prescriptions (id, family_id, health_profile_id, issued_date) VALUES ($1, $2, $3, '2026-10-01')`,
        [prescriptionId, familyId, profileId],
      ),
    ).rejects.toThrow(/prescriptions_has_source/);
    await owner.query(
      `INSERT INTO prescriptions (id, family_id, health_profile_id, source_document_id, issued_date)
       VALUES ($1, $2, $3, $4, '2026-10-01')`,
      [prescriptionId, familyId, profileId, documentId],
    );
    const insertItem = (values: string) =>
      owner.query(
        `INSERT INTO prescription_items (id, family_id, prescription_id, position, name, name_normalized,
           quantity_per_dose, slots, duration_days, long_term) VALUES ($1, $2, $3, 0, 'A', 'a', ${values})`,
        [randomUUID(), familyId, prescriptionId],
      );
    await expect(insertItem(`1, ARRAY['morning'], NULL, false`)).rejects.toThrow(
      /prescription_items_duration/,
    );
    await expect(insertItem(`1, ARRAY[]::text[], 5, false`)).rejects.toThrow(
      /prescription_items_slots_valid/,
    );
    await expect(insertItem(`1, ARRAY['sang'], 5, false`)).rejects.toThrow(/prescription_items_slots_valid/);
    await expect(insertItem(`0, ARRAY['noon'], 5, false`)).rejects.toThrow(/quantity_positive/);
    await expect(insertItem(`1, ARRAY['morning', 'evening'], NULL, true`)).resolves.toMatchObject({
      rowCount: 1,
    });
    await expect(
      owner.query(
        `INSERT INTO lab_results (id, family_id, health_profile_id, result_date, test_name, test_name_normalized, value)
         VALUES ($1, $2, $3, '2026-10-01', 'HbA1c', 'hba1c', '7.2')`,
        [randomUUID(), familyId, profileId],
      ),
    ).rejects.toThrow(/lab_results_has_source/);
  });

  it('BR-010: xóa hồ sơ xóa dây chuyền chứng từ, số đo và gỡ liên kết tài khoản', async () => {
    await owner.query(`DELETE FROM health_profiles WHERE id = $1`, [profileId]);
    const remaining = await owner.query<{ total: string }>(
      `SELECT (SELECT count(*) FROM source_documents) + (SELECT count(*) FROM measurements)
            + (SELECT count(*) FROM upload_batches) + (SELECT count(*) FROM prescriptions)
            + (SELECT count(*) FROM prescription_items) AS total`,
    );
    expect(remaining.rows[0]?.total).toBe('0');
    const account = await owner.query(`SELECT health_profile_id FROM accounts WHERE id = $1`, [accountId]);
    expect(account.rows[0]).toEqual({ health_profile_id: null });
  });
});
