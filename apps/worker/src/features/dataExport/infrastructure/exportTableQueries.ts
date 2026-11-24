// Danh sách cho phép cố định; tên bảng không bao giờ đến từ payload.
const PROFILE_TABLES = [
  'medication_courses',
  'prescriptions',
  'reminders',
  'reminder_recipients',
  'dose_confirmations',
  'dose_slots',
  'as_needed_doses',
  'measurements',
  'lab_results',
  'temperature_readings',
  'revisit_reminders',
  'pain_issues',
  'pain_entries',
  'exercise_notes',
  'pain_issue_status_events',
  'source_documents',
  'adherence_periods',
  'profile_guardians',
] as const;
const CONSENT_TABLES = [
  {
    name: 'consent_invitations',
    columns: [
      'id',
      'profile_id',
      'expires_at',
      'revoked_at',
      'decision',
      'respondent_name',
      'basis',
      'inviter_attested_at',
      'responded_at',
      'created_at',
    ],
  },
  { name: 'consent_legacy_attestations', columns: ['profile_id', 'confirmed_at', 'basis'] },
  { name: 'profile_link_events', columns: ['id', 'profile_id', 'action', 'actor_role', 'created_at'] },
];
export const EXPORT_TABLE_QUERIES: readonly { name: string; sql: string }[] = [
  ...CONSENT_TABLES.map(({ name, columns }) => ({
    name,
    sql: `SELECT ${columns.map((column) => `t.${column}`).join(', ')} FROM ${name} t WHERE t.profile_id = $1 AND t.family_id = $2`,
  })),
  ...PROFILE_TABLES.map((name) => ({
    name,
    sql: `SELECT t.* FROM ${name} t WHERE t.health_profile_id = $1 AND t.family_id = $2`,
  })),
  {
    name: 'prescription_items',
    sql: `SELECT t.* FROM prescription_items t JOIN prescriptions p
      ON p.id = t.prescription_id AND p.family_id = t.family_id
      WHERE p.health_profile_id = $1 AND p.family_id = $2 AND t.family_id = $2`,
  },
];
