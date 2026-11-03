CREATE TABLE "profile_link_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_account_id" uuid,
	"actor_role" text NOT NULL,
	"from_account_id" uuid,
	"to_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_link_events_action_valid" CHECK ("profile_link_events"."action" IN ('link', 'unlink', 'transfer')),
	CONSTRAINT "profile_link_events_actor_role_valid" CHECK ("profile_link_events"."actor_role" IN ('invitee', 'owner', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "profile_link_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_link_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_account_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"accepted_by_account_id" uuid,
	"decision" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_link_invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "profile_link_invitations_decision_valid" CHECK ("profile_link_invitations"."decision" IN ('accepted', 'declined')),
	CONSTRAINT "profile_link_invitations_decision_complete" CHECK (("profile_link_invitations"."accepted_at" IS NULL) = ("profile_link_invitations"."decision" IS NULL)),
	CONSTRAINT "profile_link_invitations_undecided_no_account" CHECK ("profile_link_invitations"."accepted_at" IS NOT NULL OR "profile_link_invitations"."accepted_by_account_id" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "profile_link_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_link_events" ADD CONSTRAINT "profile_link_events_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_events" ADD CONSTRAINT "profile_link_events_actor_account_id_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_events" ADD CONSTRAINT "profile_link_events_from_account_id_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_events" ADD CONSTRAINT "profile_link_events_to_account_id_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_events" ADD CONSTRAINT "profile_link_events_profile_family_fk" FOREIGN KEY ("profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_invitations" ADD CONSTRAINT "profile_link_invitations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_invitations" ADD CONSTRAINT "profile_link_invitations_invited_by_account_id_accounts_id_fk" FOREIGN KEY ("invited_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_invitations" ADD CONSTRAINT "profile_link_invitations_accepted_by_account_id_accounts_id_fk" FOREIGN KEY ("accepted_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_invitations" ADD CONSTRAINT "profile_link_invitations_profile_family_fk" FOREIGN KEY ("profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_link_events_profile_created_idx" ON "profile_link_events" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "profile_link_invitations_profile_idx" ON "profile_link_invitations" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_link_invitations_one_pending_unique" ON "profile_link_invitations" USING btree ("profile_id") WHERE "profile_link_invitations"."revoked_at" IS NULL AND "profile_link_invitations"."accepted_at" IS NULL;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "profile_link_events" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "profile_link_invitations" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "adherence_periods" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "consent_invitations" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "consent_legacy_attestations" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "dose_slots" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "extraction_reservations" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "extractions" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "family_extraction_spend" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "health_profiles" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "lab_results" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "measurements" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "medication_courses" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "object_purges" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "ocr_operations" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "prescription_items" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR EXISTS (SELECT 1 FROM prescriptions parent WHERE parent.id = prescription_items.prescription_id AND parent.health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid)));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "prescriptions" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "push_subscriptions" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "reminder_deliveries" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "reminder_recipients" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "reminders" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "revisit_reminders" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "source_documents" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "upload_batches" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "family_scan_quotas" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
ALTER POLICY "family_isolation_policy" ON "scan_quota_audit" TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
-- LG-02, SPEC-040: ngừng link đồng thuận không cần đăng nhập; giữ consent_status vì main vẫn xác nhận được ở invited (SPEC-005).
UPDATE "consent_invitations" SET "revoked_at" = now() WHERE "revoked_at" IS NULL AND "decision" IS NULL;
