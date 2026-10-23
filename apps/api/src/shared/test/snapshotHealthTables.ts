import type pg from 'pg';

const SNAPSHOT_TABLES = [
  'health_profiles',
  'accounts',
  'consent_invitations',
  'upload_batches',
  'source_documents',
  'extractions',
  'measurements',
  'prescriptions',
  'prescription_items',
  'medication_courses',
  'lab_results',
  'adherence_periods',
  'dose_slots',
  'reminder_recipients',
  'reminders',
];

// Chụp toàn bộ dòng các bảng sức khỏe bằng role owner để chứng minh request bị từ chối không ghi gì.
// Sắp theo nội dung dòng vì một số bảng (dose_slots, reminder_recipients) không có cột id.
export async function snapshotHealthTables(owner: pg.Client) {
  const tables: Record<string, unknown> = {};
  for (const table of SNAPSHOT_TABLES) {
    const sql = `SELECT coalesce(json_agg(x ORDER BY row_to_json(x)::text), '[]') AS rows FROM ${table} x`;
    tables[table] = (await owner.query(sql)).rows[0].rows;
  }
  return tables;
}
