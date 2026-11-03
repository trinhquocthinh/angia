CREATE TABLE "as_needed_doses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"medication_course_id" uuid NOT NULL,
	"given_at" timestamp with time zone NOT NULL,
	"quantity" numeric(10, 3),
	"unit" text,
	"recorded_by_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "as_needed_doses_quantity_valid" CHECK ("as_needed_doses"."quantity" IS NULL OR ("as_needed_doses"."quantity" > 0 AND "as_needed_doses"."quantity" <= 1000)),
	CONSTRAINT "as_needed_doses_unit_length" CHECK ("as_needed_doses"."unit" IS NULL OR char_length("as_needed_doses"."unit") BETWEEN 1 AND 20)
);
--> statement-breakpoint
ALTER TABLE "as_needed_doses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "temperature_readings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"celsius" numeric(3, 1) NOT NULL,
	"measured_at" timestamp with time zone NOT NULL,
	"recorded_by_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "temperature_readings_celsius_range" CHECK ("temperature_readings"."celsius" BETWEEN 25.0 AND 50.0)
);
--> statement-breakpoint
ALTER TABLE "temperature_readings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "medication_courses" ADD COLUMN "user_interval_text" text;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD COLUMN "min_interval_text" text;--> statement-breakpoint
ALTER TABLE "as_needed_doses" ADD CONSTRAINT "as_needed_doses_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "as_needed_doses" ADD CONSTRAINT "as_needed_doses_medication_course_id_medication_courses_id_fk" FOREIGN KEY ("medication_course_id") REFERENCES "public"."medication_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "as_needed_doses" ADD CONSTRAINT "as_needed_doses_recorded_by_account_id_accounts_id_fk" FOREIGN KEY ("recorded_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "as_needed_doses" ADD CONSTRAINT "as_needed_doses_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature_readings" ADD CONSTRAINT "temperature_readings_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature_readings" ADD CONSTRAINT "temperature_readings_recorded_by_account_id_accounts_id_fk" FOREIGN KEY ("recorded_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature_readings" ADD CONSTRAINT "temperature_readings_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "as_needed_doses_course_given_idx" ON "as_needed_doses" USING btree ("medication_course_id","given_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "as_needed_doses_profile_given_idx" ON "as_needed_doses" USING btree ("health_profile_id","given_at");--> statement-breakpoint
CREATE INDEX "temperature_readings_profile_measured_idx" ON "temperature_readings" USING btree ("health_profile_id","measured_at");--> statement-breakpoint
ALTER TABLE "medication_courses" ADD CONSTRAINT "medication_courses_user_interval_valid" CHECK ("medication_courses"."user_interval_text" IS NULL OR (char_length("medication_courses"."user_interval_text") BETWEEN 1 AND 100 AND "medication_courses"."slots" = ARRAY['as_needed']::text[] AND "medication_courses"."prescription_item_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_min_interval_valid" CHECK ("prescription_items"."min_interval_text" IS NULL OR (char_length("prescription_items"."min_interval_text") BETWEEN 1 AND 100 AND "prescription_items"."slots" = ARRAY['as_needed']::text[]));--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "as_needed_doses" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "temperature_readings" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND (NULLIF(current_setting('app.self_profile_id', true), '') IS NULL OR health_profile_id = NULLIF(current_setting('app.self_profile_id', true), '')::uuid));