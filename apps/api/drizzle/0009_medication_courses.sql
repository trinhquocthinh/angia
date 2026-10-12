CREATE TABLE "medication_courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"prescription_item_id" uuid,
	"source" text NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"quantity_per_dose" numeric NOT NULL,
	"dose_unit" text,
	"slots" text[] NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text NOT NULL,
	CONSTRAINT "medication_courses_prescription_item_unique" UNIQUE("prescription_item_id"),
	CONSTRAINT "medication_courses_source_valid" CHECK ("medication_courses"."source" IN ('prescription', 'self_reported')),
	CONSTRAINT "medication_courses_status_valid" CHECK ("medication_courses"."status" IN ('active', 'ended', 'stopped', 'replaced')),
	CONSTRAINT "medication_courses_has_source" CHECK (("medication_courses"."source" = 'prescription' AND "medication_courses"."prescription_item_id" IS NOT NULL) OR ("medication_courses"."source" = 'self_reported' AND "medication_courses"."prescription_item_id" IS NULL)),
	CONSTRAINT "medication_courses_quantity_positive" CHECK ("medication_courses"."quantity_per_dose" > 0),
	CONSTRAINT "medication_courses_slots_valid" CHECK (cardinality("medication_courses"."slots") >= 1 AND "medication_courses"."slots" <@ ARRAY['morning', 'noon', 'afternoon', 'evening']::text[]),
	CONSTRAINT "medication_courses_dates_valid" CHECK ("medication_courses"."end_date" IS NULL OR "medication_courses"."end_date" >= "medication_courses"."start_date"),
	CONSTRAINT "medication_courses_terminal_has_end" CHECK ("medication_courses"."status" = 'active' OR "medication_courses"."end_date" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "medication_courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "medication_courses" ADD CONSTRAINT "medication_courses_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_courses" ADD CONSTRAINT "medication_courses_prescription_item_id_prescription_items_id_fk" FOREIGN KEY ("prescription_item_id") REFERENCES "public"."prescription_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_courses" ADD CONSTRAINT "medication_courses_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "medication_courses_profile_status_idx" ON "medication_courses" USING btree ("health_profile_id","status");--> statement-breakpoint
CREATE INDEX "medication_courses_profile_name_idx" ON "medication_courses" USING btree ("health_profile_id","name_normalized");--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "medication_courses" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);