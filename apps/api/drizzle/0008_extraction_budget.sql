CREATE TABLE "extraction_reservations" (
	"source_document_id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"month" text NOT NULL,
	"amount_usd" numeric(10, 6) NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extraction_reservations_amount_positive" CHECK ("extraction_reservations"."amount_usd" > 0)
);
--> statement-breakpoint
ALTER TABLE "extraction_reservations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "extraction_spend" (
	"month" text PRIMARY KEY NOT NULL,
	"spent_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"cap_usd" numeric(10, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extraction_spend_month_format" CHECK ("extraction_spend"."month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
	CONSTRAINT "extraction_spend_spent_non_negative" CHECK ("extraction_spend"."spent_usd" >= 0),
	CONSTRAINT "extraction_spend_cap_non_negative" CHECK ("extraction_spend"."cap_usd" >= 0)
);
--> statement-breakpoint
ALTER TABLE "extraction_reservations" ADD CONSTRAINT "extraction_reservations_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction_reservations" ADD CONSTRAINT "extraction_reservations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction_reservations" ADD CONSTRAINT "extraction_reservations_month_extraction_spend_month_fk" FOREIGN KEY ("month") REFERENCES "public"."extraction_spend"("month") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "extraction_reservations" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);