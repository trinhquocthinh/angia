CREATE TABLE "dose_confirmations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"date" date NOT NULL,
	"slot" text NOT NULL,
	"reminder_id" uuid,
	"confirmed_by_account_id" uuid,
	"confirmed_by_name" text NOT NULL,
	"confirmed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "dose_confirmations_profile_date_slot_unique" UNIQUE("health_profile_id","date","slot"),
	CONSTRAINT "dose_confirmations_slot_valid" CHECK ("dose_confirmations"."slot" IN ('morning', 'noon', 'afternoon', 'evening')),
	CONSTRAINT "dose_confirmations_name_length" CHECK (char_length("dose_confirmations"."confirmed_by_name") BETWEEN 1 AND 60)
);
--> statement-breakpoint
ALTER TABLE "dose_confirmations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dose_confirmations" ADD CONSTRAINT "dose_confirmations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_confirmations" ADD CONSTRAINT "dose_confirmations_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_confirmations" ADD CONSTRAINT "dose_confirmations_confirmed_by_account_id_accounts_id_fk" FOREIGN KEY ("confirmed_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_confirmations" ADD CONSTRAINT "dose_confirmations_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "dose_confirmations" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));