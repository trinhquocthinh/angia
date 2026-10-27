CREATE TABLE "ai_billing_sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"credential_fingerprint" text NOT NULL,
	"status" text DEFAULT 'unverified' NOT NULL,
	"last_counter" numeric(40, 12),
	"last_attempt_at" timestamp with time zone,
	"last_complete_at" timestamp with time zone,
	"lease_token" uuid,
	"lease_expires_at" timestamp with time zone,
	CONSTRAINT "ai_billing_sources_provider_valid" CHECK ("ai_billing_sources"."provider" IN ('woku', 'openrouter')),
	CONSTRAINT "ai_billing_sources_status_valid" CHECK ("ai_billing_sources"."status" IN ('unverified', 'complete', 'gap', 'error', 'counter_reset', 'credential_changed', 'receipt_conflict', 'missing_credential')),
	CONSTRAINT "ai_billing_sources_counter_non_negative" CHECK ("ai_billing_sources"."last_counter" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ai_provider_charges" (
	"source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"charged_at" timestamp with time zone NOT NULL,
	"counter_amount" numeric(40, 12) NOT NULL,
	"unit_divisor" numeric(40, 12) NOT NULL,
	CONSTRAINT "ai_provider_charges_source_id_external_id_pk" PRIMARY KEY("source_id","external_id"),
	CONSTRAINT "ai_provider_charges_counter_non_negative" CHECK ("ai_provider_charges"."counter_amount" >= 0),
	CONSTRAINT "ai_provider_charges_divisor_positive" CHECK ("ai_provider_charges"."unit_divisor" > 0)
);
--> statement-breakpoint
ALTER TABLE "ai_provider_charges" ADD CONSTRAINT "ai_provider_charges_source_id_ai_billing_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."ai_billing_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_billing_sources_credential_unique" ON "ai_billing_sources" USING btree ("provider","credential_fingerprint");--> statement-breakpoint
CREATE INDEX "ai_provider_charges_month_idx" ON "ai_provider_charges" USING btree ("charged_at","source_id");