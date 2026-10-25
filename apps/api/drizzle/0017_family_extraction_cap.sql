CREATE TABLE "family_extraction_spend" (
	"family_id" uuid NOT NULL,
	"month" text NOT NULL,
	"spent_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "family_extraction_spend_family_id_month_pk" PRIMARY KEY("family_id","month"),
	CONSTRAINT "family_extraction_spend_spent_non_negative" CHECK ("family_extraction_spend"."spent_usd" >= 0)
);
--> statement-breakpoint
ALTER TABLE "family_extraction_spend" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "extraction_cap_usd" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "family_extraction_spend" ADD CONSTRAINT "family_extraction_spend_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_extraction_spend" ADD CONSTRAINT "family_extraction_spend_month_extraction_spend_month_fk" FOREIGN KEY ("month") REFERENCES "public"."extraction_spend"("month") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_extraction_cap_range" CHECK ("families"."extraction_cap_usd" IS NULL OR "families"."extraction_cap_usd" BETWEEN 0 AND 100);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "family_extraction_spend" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
-- SPEC-031: chỗ giữ ngân sách đang mở lúc deploy (F03a) được tính vào dòng gia đình để quyết toán không lệch.
INSERT INTO "family_extraction_spend" ("family_id", "month", "spent_usd")
SELECT "family_id", "month", SUM("amount_usd") FROM "extraction_reservations" GROUP BY "family_id", "month"
ON CONFLICT ("family_id", "month") DO NOTHING;
