CREATE TABLE "exercise_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"pain_issue_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"source" text NOT NULL,
	"prescriber" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"note" text,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_notes_source_valid" CHECK ("exercise_notes"."source" IN ('prescribed', 'self')),
	CONSTRAINT "exercise_notes_prescriber_source_valid" CHECK ("exercise_notes"."source" = 'prescribed' OR "exercise_notes"."prescriber" IS NULL),
	CONSTRAINT "exercise_notes_dates_valid" CHECK ("exercise_notes"."end_date" IS NULL OR "exercise_notes"."end_date" >= "exercise_notes"."start_date"),
	CONSTRAINT "exercise_notes_name_length" CHECK (char_length("exercise_notes"."name") BETWEEN 1 AND 100),
	CONSTRAINT "exercise_notes_prescriber_length" CHECK (char_length("exercise_notes"."prescriber") <= 100),
	CONSTRAINT "exercise_notes_note_length" CHECK (char_length("exercise_notes"."note") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "exercise_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pain_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"pain_issue_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"note" text,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pain_entries_level_range" CHECK ("pain_entries"."level" BETWEEN 1 AND 10),
	CONSTRAINT "pain_entries_note_length" CHECK (char_length("pain_entries"."note") <= 500)
);
--> statement-breakpoint
ALTER TABLE "pain_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pain_issue_status_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"pain_issue_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"on_date" date NOT NULL,
	"actor_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pain_issue_status_events_kind_valid" CHECK ("pain_issue_status_events"."kind" IN ('resolved', 'reopened'))
);
--> statement-breakpoint
ALTER TABLE "pain_issue_status_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pain_issues" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"region" text NOT NULL,
	"side" text NOT NULL,
	"title" text,
	"status" text NOT NULL,
	"resolved_on" date,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pain_issues_id_family_unique" UNIQUE("id","family_id"),
	CONSTRAINT "pain_issues_side_valid" CHECK ("pain_issues"."side" IN ('left', 'right', 'center')),
	CONSTRAINT "pain_issues_status_valid" CHECK ("pain_issues"."status" IN ('tracking', 'resolved')),
	CONSTRAINT "pain_issues_resolved_on_valid" CHECK (("pain_issues"."status" = 'resolved') = ("pain_issues"."resolved_on" IS NOT NULL)),
	CONSTRAINT "pain_issues_title_length" CHECK (char_length("pain_issues"."title") <= 60)
);
--> statement-breakpoint
ALTER TABLE "pain_issues" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "exercise_notes" ADD CONSTRAINT "exercise_notes_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_notes" ADD CONSTRAINT "exercise_notes_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_notes" ADD CONSTRAINT "exercise_notes_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_notes" ADD CONSTRAINT "exercise_notes_issue_family_fk" FOREIGN KEY ("pain_issue_id","family_id") REFERENCES "public"."pain_issues"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_notes" ADD CONSTRAINT "exercise_notes_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_entries" ADD CONSTRAINT "pain_entries_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_entries" ADD CONSTRAINT "pain_entries_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_entries" ADD CONSTRAINT "pain_entries_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_entries" ADD CONSTRAINT "pain_entries_issue_family_fk" FOREIGN KEY ("pain_issue_id","family_id") REFERENCES "public"."pain_issues"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_entries" ADD CONSTRAINT "pain_entries_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_issue_status_events" ADD CONSTRAINT "pain_issue_status_events_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_issue_status_events" ADD CONSTRAINT "pain_issue_status_events_actor_account_id_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_issue_status_events" ADD CONSTRAINT "pain_issue_status_events_issue_family_fk" FOREIGN KEY ("pain_issue_id","family_id") REFERENCES "public"."pain_issues"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_issue_status_events" ADD CONSTRAINT "pain_issue_status_events_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_issues" ADD CONSTRAINT "pain_issues_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_issues" ADD CONSTRAINT "pain_issues_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_issues" ADD CONSTRAINT "pain_issues_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pain_issues" ADD CONSTRAINT "pain_issues_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_notes_issue_start_idx" ON "exercise_notes" USING btree ("pain_issue_id","start_date");--> statement-breakpoint
CREATE INDEX "exercise_notes_profile_start_idx" ON "exercise_notes" USING btree ("health_profile_id","start_date");--> statement-breakpoint
CREATE INDEX "pain_entries_issue_recorded_idx" ON "pain_entries" USING btree ("pain_issue_id","recorded_at");--> statement-breakpoint
CREATE INDEX "pain_entries_profile_recorded_idx" ON "pain_entries" USING btree ("health_profile_id","recorded_at");--> statement-breakpoint
CREATE INDEX "pain_issue_status_events_issue_created_idx" ON "pain_issue_status_events" USING btree ("pain_issue_id","created_at");--> statement-breakpoint
CREATE INDEX "pain_issue_status_events_profile_on_idx" ON "pain_issue_status_events" USING btree ("health_profile_id","on_date");--> statement-breakpoint
CREATE UNIQUE INDEX "pain_issues_tracking_region_unique" ON "pain_issues" USING btree ("health_profile_id","region","side") WHERE "pain_issues"."status" = 'tracking';--> statement-breakpoint
CREATE INDEX "pain_issues_profile_status_idx" ON "pain_issues" USING btree ("health_profile_id","status");--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "exercise_notes" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "pain_entries" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "pain_issue_status_events" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "pain_issues" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));
--> statement-breakpoint
-- E19-S2-T2: kiểm kê HEAD 74bc8aa không có luồng ghi v0.2 qua withSelfScope; không ngoại lệ.
-- Danh sách tường minh: bảng RLS mới phải được xếp nhóm trong TC-708.
DO $$
DECLARE
  table_name text;
  not_self text := 'NULLIF(current_setting(''app.self_profile_id'', true), '''') IS NULL';
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
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
    'upload_batches'
  ] LOOP
    EXECUTE format('CREATE POLICY self_read_only_insert ON public.%I AS RESTRICTIVE FOR INSERT TO public WITH CHECK (%s)', table_name, not_self);
    EXECUTE format('CREATE POLICY self_read_only_update ON public.%I AS RESTRICTIVE FOR UPDATE TO public USING (%s) WITH CHECK (%s)', table_name, not_self, not_self);
    EXECUTE format('CREATE POLICY self_read_only_delete ON public.%I AS RESTRICTIVE FOR DELETE TO public USING (%s)', table_name, not_self);
  END LOOP;
END;
$$;
