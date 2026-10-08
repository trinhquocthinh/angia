ALTER TABLE "source_documents" DROP CONSTRAINT "source_documents_status_valid";--> statement-breakpoint
ALTER TABLE "source_documents" ADD COLUMN "ocr_image_key" text;--> statement-breakpoint
ALTER TABLE "source_documents" ADD COLUMN "ocr_image_sha256" text;--> statement-breakpoint
ALTER TABLE "source_documents" ADD COLUMN "privacy_approved_by" uuid;--> statement-breakpoint
ALTER TABLE "source_documents" ADD COLUMN "privacy_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_privacy_approved_by_accounts_id_fk" FOREIGN KEY ("privacy_approved_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_ocr_image_complete" CHECK (("source_documents"."ocr_image_key" IS NULL AND "source_documents"."ocr_image_sha256" IS NULL)
        OR ("source_documents"."ocr_image_key" IS NOT NULL AND "source_documents"."ocr_image_sha256" IS NOT NULL
          AND char_length(btrim("source_documents"."ocr_image_key")) > 0
          AND "source_documents"."ocr_image_key" = btrim("source_documents"."ocr_image_key")
          AND "source_documents"."ocr_image_key" <> "source_documents"."original_key"
          AND "source_documents"."ocr_image_sha256" ~ '^[0-9a-f]{64}$'));--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_privacy_approval_complete" CHECK (("source_documents"."privacy_approved_by" IS NULL AND "source_documents"."privacy_approved_at" IS NULL)
        OR ("source_documents"."privacy_approved_by" IS NOT NULL AND "source_documents"."privacy_approved_at" IS NOT NULL
          AND "source_documents"."ocr_image_key" IS NOT NULL AND "source_documents"."ocr_image_sha256" IS NOT NULL
          AND isfinite("source_documents"."privacy_approved_at")));--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_status_valid" CHECK ("source_documents"."status" IN ('uploaded', 'awaiting_privacy', 'extracting', 'pending_review', 'approved', 'rejected', 'manual_entry', 'awaiting_budget'));
--> statement-breakpoint
CREATE FUNCTION public.enforce_document_privacy_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF OLD.privacy_approved_at IS NOT NULL AND
    ROW(NEW.original_key, NEW.ocr_image_key, NEW.ocr_image_sha256,
        NEW.privacy_approved_by, NEW.privacy_approved_at)
    IS DISTINCT FROM
    ROW(OLD.original_key, OLD.ocr_image_key, OLD.ocr_image_sha256,
        OLD.privacy_approved_by, OLD.privacy_approved_at)
  THEN
    RAISE EXCEPTION 'document_privacy_immutable'
      USING ERRCODE = '23514', CONSTRAINT = 'source_documents_privacy_immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER source_documents_privacy_immutable
BEFORE UPDATE ON public.source_documents
FOR EACH ROW EXECUTE FUNCTION public.enforce_document_privacy_immutable();
