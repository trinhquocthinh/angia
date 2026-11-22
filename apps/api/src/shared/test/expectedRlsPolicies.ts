// Bảng dữ liệu sức khỏe bắt buộc RLS (Tech Spec §3); families/accounts/sessions phục vụ xác thực,
// extraction_spend là bảng quản trị ngân sách phi y tế (E3-S6-T1).
export const RLS_TABLES = [
  'adherence_periods',
  'as_needed_doses',
  'consent_invitations',
  'consent_legacy_attestations',
  'dose_confirmations',
  'dose_slots',
  'exercise_notes',
  'extraction_reservations',
  'extractions',
  'family_deletion_requests',
  'family_extraction_spend',
  'family_invitations',
  'family_scan_quotas',
  'health_profiles',
  'lab_results',
  'measurements',
  'medication_courses',
  'object_purges',
  'ocr_operations',
  'ownership_transfer_offers',
  'pain_entries',
  'pain_issue_status_events',
  'pain_issues',
  'prescription_items',
  'prescriptions',
  'profile_guardians',
  'profile_link_events',
  'profile_link_invitations',
  'push_subscriptions',
  'reminder_deliveries',
  'reminder_recipients',
  'reminders',
  'removed_member_windows',
  'revisit_reminders',
  'scan_quota_audit',
  'source_documents',
  'temperature_readings',
  'upload_batches',
];

// TC-569: mỗi bảng RLS thuộc đúng một dạng policy (Tech Spec §3.9.3), so khớp nguyên văn sau khi PostgreSQL chuẩn hóa.
const SETTING = (name: string) => `NULLIF(current_setting('app.${name}'::text, true), ''::text)`;
const SAME_FAMILY = `(family_id = (${SETTING('family_id')})::uuid)`;

export const PAIN_JOURNAL_TABLES = [
  'exercise_notes',
  'pain_entries',
  'pain_issue_status_events',
  'pain_issues',
];
export const SELF_READ_ONLY_TABLES = [
  'adherence_periods',
  'as_needed_doses',
  'consent_invitations',
  'consent_legacy_attestations',
  'dose_confirmations',
  'dose_slots',
  'extraction_reservations',
  'extractions',
  'family_extraction_spend',
  'family_scan_quotas',
  'health_profiles',
  'lab_results',
  'measurements',
  'medication_courses',
  'object_purges',
  'ocr_operations',
  'prescription_items',
  'prescriptions',
  'profile_link_events',
  'profile_link_invitations',
  'push_subscriptions',
  'reminder_deliveries',
  'reminder_recipients',
  'reminders',
  'revisit_reminders',
  'scan_quota_audit',
  'source_documents',
  'temperature_readings',
  'upload_batches',
];
export const NOT_SELF = `(${SETTING('self_profile_id')} IS NULL)`;

const FAMILY_ONLY_POLICY = `(${SAME_FAMILY} AND ${NOT_SELF})`;
const selfPolicy = (column: string) =>
  `(${SAME_FAMILY} AND (${NOT_SELF} OR (${column} = (${SETTING('self_profile_id')})::uuid)))`;
export const EXPECTED_POLICIES: Record<string, string> = {
  family_deletion_requests: FAMILY_ONLY_POLICY,
  family_invitations: FAMILY_ONLY_POLICY,
  ownership_transfer_offers: FAMILY_ONLY_POLICY,
  profile_guardians: FAMILY_ONLY_POLICY,
  removed_member_windows: FAMILY_ONLY_POLICY,

  adherence_periods: selfPolicy('health_profile_id'),
  as_needed_doses: selfPolicy('health_profile_id'),
  consent_invitations: selfPolicy('profile_id'),
  consent_legacy_attestations: selfPolicy('profile_id'),
  dose_confirmations: selfPolicy('health_profile_id'),
  dose_slots: selfPolicy('health_profile_id'),
  exercise_notes: selfPolicy('health_profile_id'),
  extraction_reservations: FAMILY_ONLY_POLICY,
  extractions: FAMILY_ONLY_POLICY,
  family_extraction_spend: FAMILY_ONLY_POLICY,
  family_scan_quotas: FAMILY_ONLY_POLICY,
  health_profiles: selfPolicy('id'),
  lab_results: selfPolicy('health_profile_id'),
  measurements: selfPolicy('health_profile_id'),
  medication_courses: selfPolicy('health_profile_id'),
  object_purges: FAMILY_ONLY_POLICY,
  ocr_operations: FAMILY_ONLY_POLICY,
  pain_entries: selfPolicy('health_profile_id'),
  pain_issue_status_events: selfPolicy('health_profile_id'),
  pain_issues: selfPolicy('health_profile_id'),
  prescription_items: `(${SAME_FAMILY} AND (${NOT_SELF} OR (EXISTS ( SELECT 1
   FROM prescriptions parent
  WHERE ((parent.id = prescription_items.prescription_id) AND (parent.health_profile_id = (${SETTING('self_profile_id')})::uuid))))))`,
  prescriptions: selfPolicy('health_profile_id'),
  profile_link_events: selfPolicy('profile_id'),
  profile_link_invitations: selfPolicy('profile_id'),
  push_subscriptions: FAMILY_ONLY_POLICY,
  reminder_deliveries: FAMILY_ONLY_POLICY,
  reminder_recipients: selfPolicy('health_profile_id'),
  reminders: selfPolicy('health_profile_id'),
  revisit_reminders: selfPolicy('health_profile_id'),
  scan_quota_audit: FAMILY_ONLY_POLICY,
  source_documents: selfPolicy('health_profile_id'),
  temperature_readings: selfPolicy('health_profile_id'),
  upload_batches: selfPolicy('health_profile_id'),
};

// E28-S2-T2 (0046, TC-869): role job xoá nhà chỉ chạm nhà có yêu cầu pending đến hạn.
export const FAMILY_DELETION_ROLE = 'angia_test_family_deletion';
const PENDING_DUE = `((status = 'pending'::text) AND (execute_at <= now()))`;
const REVOKED_NOW = `((status = 'revoked'::text) AND (revoked_at = now()))`;
// scan_quota_audit giữ lại làm nhật ký (D3); các bảng RLS còn lại đều có policy đến hạn.
export const FAMILY_DELETION_DUE_TABLES = RLS_TABLES.filter((table) => table !== 'scan_quota_audit');
export const familyDeletionDueOnly = (table: string) =>
  table === 'family_deletion_requests'
    ? { qual: `(${PENDING_DUE} OR ${REVOKED_NOW})`, withCheck: REVOKED_NOW }
    : {
        qual: `(EXISTS ( SELECT 1
   FROM family_deletion_requests r
  WHERE ((r.family_id = ${table}.family_id) AND (r.status = 'pending'::text) AND (r.execute_at <= now()))))`,
        withCheck: null,
      };
export const FAMILY_DELETION_SCAN_QUAL = PENDING_DUE;

// E29-S3-T2 (0051, TC-870): role job tải về chỉ đọc hồ sơ trong cửa sổ người bị gỡ còn hạn.
export const DATA_EXPORT_ROLE = 'angia_test_data_export';
export const DATA_EXPORT_WINDOW_TABLES = [
  ['health_profiles', 'id'],
  ...[
    'adherence_periods',
    'as_needed_doses',
    'dose_confirmations',
    'dose_slots',
    'exercise_notes',
    'lab_results',
    'measurements',
    'medication_courses',
    'pain_entries',
    'pain_issue_status_events',
    'pain_issues',
    'prescriptions',
    'profile_guardians',
    'reminder_recipients',
    'reminders',
    'revisit_reminders',
    'source_documents',
    'temperature_readings',
  ].map((table) => [table, 'health_profile_id']),
  ...['consent_invitations', 'consent_legacy_attestations', 'profile_link_events'].map((table) => [
    table,
    'profile_id',
  ]),
].map(([table, column]) => ({ table: table!, column: column! }));
export const DATA_EXPORT_IN_WINDOW = `((account_id = (${SETTING('export_account_id')})::uuid) AND (expires_at > now()))`;
export const dataExportWindowOnly = (table: string, column: string) =>
  table === 'prescription_items'
    ? `(EXISTS ( SELECT 1
   FROM (prescriptions p
     JOIN removed_member_windows w ON ((w.health_profile_id = p.health_profile_id)))
  WHERE (p.id = prescription_items.prescription_id)))`
    : `(EXISTS ( SELECT 1
   FROM removed_member_windows w
  WHERE (w.health_profile_id = ${table}.${column})))`;
