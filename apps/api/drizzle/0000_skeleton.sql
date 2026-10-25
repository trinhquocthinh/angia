CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"oidc_subject" text NOT NULL,
	"display_name" text NOT NULL,
	"family_id" uuid,
	"family_role" text,
	"is_system_admin" boolean DEFAULT false NOT NULL,
	"health_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_oidc_subject_unique" UNIQUE("oidc_subject"),
	CONSTRAINT "accounts_health_profile_id_unique" UNIQUE("health_profile_id"),
	CONSTRAINT "accounts_family_role_valid" CHECK ("accounts"."family_role" IN ('main', 'member'))
);
--> statement-breakpoint
CREATE TABLE "extractions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"source_document_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"payload" jsonb NOT NULL,
	"cost_usd" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extractions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"birth_year" integer,
	"consent_confirmed_at" timestamp with time zone,
	"consent_confirmed_by" uuid,
	"consent_basis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "health_profiles_consent_basis_valid" CHECK ("health_profiles"."consent_basis" IN ('self', 'guardian'))
);
--> statement-breakpoint
ALTER TABLE "health_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"source_document_id" uuid,
	"kind" text NOT NULL,
	"measured_on" date NOT NULL,
	"measured_time" text,
	"systolic" integer,
	"diastolic" integer,
	"pulse" integer,
	"glucose_value" numeric,
	"glucose_unit" text,
	"manual_without_source" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurements_kind_valid" CHECK ("measurements"."kind" IN ('blood_pressure', 'blood_glucose')),
	CONSTRAINT "measurements_has_source" CHECK ("measurements"."source_document_id" IS NOT NULL OR "measurements"."manual_without_source" = true),
	CONSTRAINT "measurements_blood_pressure_valid" CHECK ("measurements"."kind" <> 'blood_pressure' OR ("measurements"."systolic" IS NOT NULL AND "measurements"."diastolic" IS NOT NULL AND "measurements"."systolic" > "measurements"."diastolic")),
	CONSTRAINT "measurements_blood_glucose_valid" CHECK ("measurements"."kind" <> 'blood_glucose' OR ("measurements"."glucose_value" IS NOT NULL AND "measurements"."glucose_unit" IN ('mmol/L', 'mg/dL')))
);
--> statement-breakpoint
ALTER TABLE "measurements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"csrf_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"type" text,
	"status" text NOT NULL,
	"document_date" date,
	"original_key" text NOT NULL,
	"preview_key" text,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_documents_status_valid" CHECK ("source_documents"."status" IN ('uploaded', 'extracting', 'pending_review', 'approved', 'rejected', 'manual_entry', 'awaiting_budget')),
	CONSTRAINT "source_documents_type_valid" CHECK ("source_documents"."type" IN ('prescription', 'lab_result', 'device_reading')),
	CONSTRAINT "source_documents_approved_has_date" CHECK ("source_documents"."status" <> 'approved' OR "source_documents"."document_date" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "source_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "upload_batches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_health_profile_id_health_profiles_id_fk" FOREIGN KEY ("health_profile_id") REFERENCES "public"."health_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_consent_confirmed_by_accounts_id_fk" FOREIGN KEY ("consent_confirmed_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_health_profile_id_health_profiles_id_fk" FOREIGN KEY ("health_profile_id") REFERENCES "public"."health_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_health_profile_id_health_profiles_id_fk" FOREIGN KEY ("health_profile_id") REFERENCES "public"."health_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_batch_id_upload_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_health_profile_id_health_profiles_id_fk" FOREIGN KEY ("health_profile_id") REFERENCES "public"."health_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_family_id_idx" ON "accounts" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "extractions_source_document_id_idx" ON "extractions" USING btree ("source_document_id");--> statement-breakpoint
CREATE INDEX "health_profiles_family_id_idx" ON "health_profiles" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "measurements_profile_kind_date_idx" ON "measurements" USING btree ("health_profile_id","kind","measured_on");--> statement-breakpoint
CREATE INDEX "sessions_account_id_idx" ON "sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "source_documents_profile_date_idx" ON "source_documents" USING btree ("health_profile_id","document_date");--> statement-breakpoint
CREATE INDEX "source_documents_status_idx" ON "source_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "upload_batches_health_profile_id_idx" ON "upload_batches" USING btree ("health_profile_id");--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "extractions" AS PERMISSIVE FOR ALL TO public USING (family_id = current_setting('app.family_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "health_profiles" AS PERMISSIVE FOR ALL TO public USING (family_id = current_setting('app.family_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "measurements" AS PERMISSIVE FOR ALL TO public USING (family_id = current_setting('app.family_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "source_documents" AS PERMISSIVE FOR ALL TO public USING (family_id = current_setting('app.family_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "upload_batches" AS PERMISSIVE FOR ALL TO public USING (family_id = current_setting('app.family_id', true)::uuid);