CREATE TABLE "adherence_periods" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"medication_name" text NOT NULL,
	"medication_name_normalized" text NOT NULL,
	"status" text NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date,
	"recorded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "adherence_periods_status_valid" CHECK ("adherence_periods"."status" IN ('taking', 'stopped')),
	CONSTRAINT "adherence_periods_dates_valid" CHECK ("adherence_periods"."to_date" IS NULL OR "adherence_periods"."to_date" >= "adherence_periods"."from_date")
);
--> statement-breakpoint
ALTER TABLE "adherence_periods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "adherence_periods" ADD CONSTRAINT "adherence_periods_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adherence_periods" ADD CONSTRAINT "adherence_periods_recorded_by_accounts_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adherence_periods" ADD CONSTRAINT "adherence_periods_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "adherence_periods_profile_name_from_idx" ON "adherence_periods" USING btree ("health_profile_id","medication_name_normalized","from_date");--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "adherence_periods" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
-- BR-032/TC-089: cùng thuốc trên một hồ sơ không được chồng lấn; to_date NULL = mở vô hạn (daterange cận trên trống).
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "adherence_periods" ADD CONSTRAINT "adherence_periods_no_overlap" EXCLUDE USING gist ("health_profile_id" WITH =, "medication_name_normalized" WITH =, daterange("from_date", "to_date", '[]') WITH &&);
