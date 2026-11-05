CREATE TABLE "scan_quota_policy" (
	"id" smallint PRIMARY KEY NOT NULL,
	"version" bigint DEFAULT 0 NOT NULL,
	"estimated_cost_per_scan_usd" numeric,
	"reserve_basis_points" smallint,
	"trial_scans" bigint,
	"updated_at" timestamp with time zone,
	"updated_by" uuid,
	CONSTRAINT "scan_quota_policy_singleton" CHECK ("scan_quota_policy"."id" = 1),
	CONSTRAINT "scan_quota_policy_version" CHECK ("scan_quota_policy"."version" BETWEEN 0 AND 9007199254740991),
	CONSTRAINT "scan_quota_policy_settings" CHECK (("scan_quota_policy"."estimated_cost_per_scan_usd" IS NULL AND "scan_quota_policy"."reserve_basis_points" IS NULL AND "scan_quota_policy"."trial_scans" IS NULL) OR ("scan_quota_policy"."estimated_cost_per_scan_usd" IS NOT NULL AND "scan_quota_policy"."reserve_basis_points" IS NOT NULL AND "scan_quota_policy"."trial_scans" IS NOT NULL AND "scan_quota_policy"."estimated_cost_per_scan_usd" > 0 AND scale("scan_quota_policy"."estimated_cost_per_scan_usd") <= 12 AND "scan_quota_policy"."estimated_cost_per_scan_usd" < 10000000000000000000000000000 AND "scan_quota_policy"."reserve_basis_points" BETWEEN 0 AND 10000 AND "scan_quota_policy"."trial_scans" BETWEEN 0 AND 9007199254740991))
);
--> statement-breakpoint
CREATE TABLE "scan_quota_months" (
	"month" text PRIMARY KEY NOT NULL,
	"committed_remaining_scans" numeric DEFAULT '0' NOT NULL,
	CONSTRAINT "scan_quota_months_month" CHECK ("scan_quota_months"."month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
	CONSTRAINT "scan_quota_months_committed" CHECK ("scan_quota_months"."committed_remaining_scans" >= 0 AND "scan_quota_months"."committed_remaining_scans" < 'Infinity'::numeric AND "scan_quota_months"."committed_remaining_scans" = trunc("scan_quota_months"."committed_remaining_scans"))
);
--> statement-breakpoint
CREATE TABLE "family_scan_quotas" (
	"family_id" uuid NOT NULL,
	"month" text NOT NULL,
	"status" text NOT NULL,
	"granted_scans" bigint NOT NULL,
	"used_scans" bigint DEFAULT 0 NOT NULL,
	"held_scans" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"updated_by" uuid NOT NULL,
	CONSTRAINT "family_scan_quotas_family_id_month_pk" PRIMARY KEY("family_id","month"),
	CONSTRAINT "family_scan_quotas_status" CHECK ("family_scan_quotas"."status" IN ('trial', 'approved')),
	CONSTRAINT "family_scan_quotas_counts" CHECK ("family_scan_quotas"."granted_scans" BETWEEN 0 AND 9007199254740991 AND "family_scan_quotas"."used_scans" >= 0 AND "family_scan_quotas"."held_scans" >= 0 AND "family_scan_quotas"."used_scans" + "family_scan_quotas"."held_scans" <= "family_scan_quotas"."granted_scans")
);
--> statement-breakpoint
ALTER TABLE "family_scan_quotas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "scan_quota_audit" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"month" text NOT NULL,
	"version" bigint NOT NULL,
	"actor_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"before" jsonb,
	"after" jsonb NOT NULL,
	"reason" text NOT NULL,
	CONSTRAINT "scan_quota_audit_version" CHECK ("scan_quota_audit"."version" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "scan_quota_audit_reason" CHECK (length(btrim("scan_quota_audit"."reason")) BETWEEN 1 AND 500)
);
--> statement-breakpoint
ALTER TABLE "scan_quota_audit" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "scan_quota_policy_audit" (
	"version" bigint PRIMARY KEY NOT NULL,
	"actor_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"before" jsonb,
	"after" jsonb NOT NULL,
	CONSTRAINT "scan_quota_policy_audit_version" CHECK ("scan_quota_policy_audit"."version" BETWEEN 1 AND 9007199254740991)
);
--> statement-breakpoint
ALTER TABLE "scan_quota_policy" ADD CONSTRAINT "scan_quota_policy_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_scan_quotas" ADD CONSTRAINT "family_scan_quotas_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_scan_quotas" ADD CONSTRAINT "family_scan_quotas_month_scan_quota_months_month_fk" FOREIGN KEY ("month") REFERENCES "public"."scan_quota_months"("month") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_scan_quotas" ADD CONSTRAINT "family_scan_quotas_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_quota_audit" ADD CONSTRAINT "scan_quota_audit_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_quota_audit" ADD CONSTRAINT "scan_quota_audit_month_scan_quota_months_month_fk" FOREIGN KEY ("month") REFERENCES "public"."scan_quota_months"("month") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_quota_audit" ADD CONSTRAINT "scan_quota_audit_actor_id_accounts_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_quota_policy_audit" ADD CONSTRAINT "scan_quota_policy_audit_actor_id_accounts_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "family_scan_quotas" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "scan_quota_audit" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
-- Audit chỉ được thêm; owner vẫn có thể TRUNCATE trong fixture hoặc phục hồi dữ liệu.
CREATE FUNCTION reject_scan_quota_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Scan quota audit is append only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER scan_quota_audit_append_only BEFORE UPDATE OR DELETE ON scan_quota_audit
  FOR EACH ROW EXECUTE FUNCTION reject_scan_quota_audit_mutation();
--> statement-breakpoint
CREATE TRIGGER scan_quota_policy_audit_append_only BEFORE UPDATE OR DELETE ON scan_quota_policy_audit
  FOR EACH ROW EXECUTE FUNCTION reject_scan_quota_audit_mutation();
