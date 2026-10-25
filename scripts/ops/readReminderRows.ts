import pg from 'pg';

export interface ReminderRow {
  reminderId: string;
  profileId: string;
  date: string;
  slot: string;
  scheduledAt: Date;
  sentAt: Date | null;
}

export interface DeliveryRow {
  deliveryId: string;
  reminderId: string;
  status: string;
  attempts: number;
  lastError: string | null;
  acceptedAt: Date | null;
}

export interface ReminderAuditRows {
  reminders: ReminderRow[];
  deliveries: DeliveryRow[];
}

// Chỉ đọc mã, mốc thời gian và trạng thái gửi — không đọc `medications` hay tên hồ sơ nên báo cáo
// không chứa dữ liệu sức khỏe. Bảng có RLS nên đọc từng gia đình trong transaction chỉ đọc kèm
// set_config('app.family_id', ..., true) như withFamilyScope; role app không bypass RLS.
const REMINDERS_SQL = `
  SELECT id, health_profile_id, date::text AS date, slot, scheduled_at, sent_at
  FROM reminders
  WHERE scheduled_at >= $1 AND scheduled_at <= $2
  ORDER BY scheduled_at`;

const DELIVERIES_SQL = `
  SELECT d.id, d.reminder_id, d.status, d.attempts, d.last_error, d.accepted_at
  FROM reminder_deliveries d
  JOIN reminders r ON r.id = d.reminder_id AND r.family_id = d.family_id
  WHERE r.scheduled_at >= $1 AND r.scheduled_at <= $2`;

interface RawReminder {
  id: string;
  health_profile_id: string;
  date: string;
  slot: string;
  scheduled_at: Date;
  sent_at: Date | null;
}

interface RawDelivery {
  id: string;
  reminder_id: string;
  status: string;
  attempts: number;
  last_error: string | null;
  accepted_at: Date | null;
}

const readFamily = async (client: pg.Client, familyId: string, since: Date, until: Date) => {
  await client.query('BEGIN READ ONLY');
  try {
    await client.query(`SELECT set_config('app.family_id', $1, true)`, [familyId]);
    const reminders = await client.query<RawReminder>(REMINDERS_SQL, [since, until]);
    const deliveries = await client.query<RawDelivery>(DELIVERIES_SQL, [since, until]);
    return { reminders: reminders.rows, deliveries: deliveries.rows };
  } finally {
    await client.query('ROLLBACK');
  }
};

export async function readReminderRows(
  connectionString: string,
  since: Date,
  until: Date,
): Promise<ReminderAuditRows> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  const result: ReminderAuditRows = { reminders: [], deliveries: [] };
  try {
    await client.query('SET default_transaction_read_only = on');
    const families = await client.query<{ id: string }>('SELECT id FROM families ORDER BY id');
    for (const { id } of families.rows) {
      const rows = await readFamily(client, id, since, until);
      result.reminders.push(
        ...rows.reminders.map((row) => ({
          reminderId: row.id,
          profileId: row.health_profile_id,
          date: row.date,
          slot: row.slot,
          scheduledAt: row.scheduled_at,
          sentAt: row.sent_at,
        })),
      );
      result.deliveries.push(
        ...rows.deliveries.map((row) => ({
          deliveryId: row.id,
          reminderId: row.reminder_id,
          status: row.status,
          attempts: row.attempts,
          lastError: row.last_error,
          acceptedAt: row.accepted_at,
        })),
      );
    }
    return result;
  } finally {
    await client.end();
  }
}
