ALTER TABLE "family_scan_quotas" DROP CONSTRAINT "family_scan_quotas_status";--> statement-breakpoint
ALTER TABLE "family_scan_quotas" ALTER COLUMN "updated_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scan_quota_months" ADD COLUMN "quota_families" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "scan_quota_months" ADD COLUMN "used_scans" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "family_scan_quotas" ADD CONSTRAINT "family_scan_quotas_status" CHECK ("family_scan_quotas"."status" IN ('default', 'trial', 'approved'));--> statement-breakpoint
-- Backfill bằng role owner (bỏ qua RLS) từ dòng quota hiện có; chạy lặp an toàn.
UPDATE "scan_quota_months" m SET
  "quota_families" = (SELECT count(*) FROM "family_scan_quotas" q WHERE q."month" = m."month"),
  "used_scans" = (SELECT coalesce(sum(q."used_scans"), 0) FROM "family_scan_quotas" q WHERE q."month" = m."month");
