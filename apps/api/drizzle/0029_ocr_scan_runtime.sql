CREATE TABLE "ocr_operations" (
	"source_document_id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"month" text NOT NULL,
	"state" text NOT NULL,
	"dispatch_attempts" integer DEFAULT 0 NOT NULL,
	"dispatched_at" timestamp with time zone,
	CONSTRAINT "ocr_operations_state" CHECK ("ocr_operations"."state" IN ('held', 'dispatched', 'released')),
	CONSTRAINT "ocr_operations_dispatch" CHECK (("ocr_operations"."state" = 'dispatched' AND "ocr_operations"."dispatch_attempts" BETWEEN 1 AND 6 AND "ocr_operations"."dispatched_at" IS NOT NULL)
    OR ("ocr_operations"."state" <> 'dispatched' AND "ocr_operations"."dispatch_attempts" = 0 AND "ocr_operations"."dispatched_at" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "ocr_operations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ocr_operations" ADD CONSTRAINT "ocr_operations_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_operations" ADD CONSTRAINT "ocr_operations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_operations" ADD CONSTRAINT "ocr_operations_month_scan_quota_months_month_fk" FOREIGN KEY ("month") REFERENCES "public"."scan_quota_months"("month") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "ocr_operations" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
-- Xóa hồ sơ/chứng từ cascade: trả held, giữ nguyên used và snapshot granted-used.
-- Không lấy khóa tháng/global ở trigger này để không đảo thứ tự khóa với deleteProfile.
CREATE FUNCTION release_deleted_ocr_hold() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.state = 'held' THEN
    UPDATE family_scan_quotas SET held_scans = held_scans - 1
      WHERE family_id = OLD.family_id AND month = OLD.month;
  END IF;
  RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER ocr_operation_delete_release BEFORE DELETE ON ocr_operations
  FOR EACH ROW EXECUTE FUNCTION release_deleted_ocr_hold();
--> statement-breakpoint
-- Deploy đồng bộ, dừng worker cũ trước migration. Chỉ trả khoản DỰ TOÁN đang giữ;
-- không đổi phí đã quyết toán, cap, audit hoặc phân bổ lượt gia đình.
DO $$
DECLARE held_record record;
BEGIN
  FOR held_record IN DELETE FROM extraction_reservations RETURNING family_id, month, amount_usd LOOP
    UPDATE family_extraction_spend SET spent_usd=GREATEST(0,spent_usd-held_record.amount_usd)
      WHERE family_id=held_record.family_id AND month=held_record.month;
    UPDATE extraction_spend SET spent_usd=GREATEST(0,spent_usd-held_record.amount_usd)
      WHERE month=held_record.month;
  END LOOP;
END;
$$;
