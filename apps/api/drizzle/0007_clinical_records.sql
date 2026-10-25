CREATE TABLE "lab_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"source_document_id" uuid,
	"result_date" date NOT NULL,
	"test_name" text NOT NULL,
	"test_name_normalized" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"reference_range" text,
	"facility" text,
	"manual_without_source" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_results_has_source" CHECK ("lab_results"."source_document_id" IS NOT NULL OR "lab_results"."manual_without_source" = true)
);
--> statement-breakpoint
ALTER TABLE "lab_results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prescription_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"prescription_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"strength" text,
	"quantity_per_dose" numeric NOT NULL,
	"dose_unit" text,
	"slots" text[] NOT NULL,
	"duration_days" integer,
	"long_term" boolean NOT NULL,
	"note" text,
	"total_quantity" numeric,
	CONSTRAINT "prescription_items_duration" CHECK ("prescription_items"."duration_days" IS NOT NULL OR "prescription_items"."long_term" = true),
	CONSTRAINT "prescription_items_quantity_positive" CHECK ("prescription_items"."quantity_per_dose" > 0),
	CONSTRAINT "prescription_items_slots_valid" CHECK (cardinality("prescription_items"."slots") >= 1 AND "prescription_items"."slots" <@ ARRAY['morning', 'noon', 'afternoon', 'evening']::text[]),
	CONSTRAINT "prescription_items_duration_positive" CHECK ("prescription_items"."duration_days" IS NULL OR "prescription_items"."duration_days" > 0),
	CONSTRAINT "prescription_items_total_positive" CHECK ("prescription_items"."total_quantity" IS NULL OR "prescription_items"."total_quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "prescription_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"source_document_id" uuid,
	"issued_date" date NOT NULL,
	"facility" text,
	"diagnosis" text,
	"manual_without_source" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prescriptions_has_source" CHECK ("prescriptions"."source_document_id" IS NOT NULL OR "prescriptions"."manual_without_source" = true)
);
--> statement-breakpoint
ALTER TABLE "prescriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_health_profile_id_health_profiles_id_fk" FOREIGN KEY ("health_profile_id") REFERENCES "public"."health_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_health_profile_id_health_profiles_id_fk" FOREIGN KEY ("health_profile_id") REFERENCES "public"."health_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_results_profile_test_date_idx" ON "lab_results" USING btree ("health_profile_id","test_name_normalized","result_date");--> statement-breakpoint
CREATE INDEX "lab_results_source_document_idx" ON "lab_results" USING btree ("source_document_id");--> statement-breakpoint
CREATE INDEX "prescription_items_prescription_idx" ON "prescription_items" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "prescriptions_profile_issued_idx" ON "prescriptions" USING btree ("health_profile_id","issued_date");--> statement-breakpoint
CREATE INDEX "prescriptions_source_document_idx" ON "prescriptions" USING btree ("source_document_id");--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "lab_results" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "prescription_items" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "prescriptions" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);