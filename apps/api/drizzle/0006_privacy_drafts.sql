ALTER TABLE public.source_documents ADD COLUMN privacy_draft_id uuid;
--> statement-breakpoint
ALTER TABLE public.source_documents ADD COLUMN privacy_draft_status text;
--> statement-breakpoint
ALTER TABLE public.source_documents ADD CONSTRAINT source_documents_privacy_draft_complete CHECK (
  (privacy_draft_id IS NULL AND privacy_draft_status IS NULL)
  OR (privacy_draft_id IS NOT NULL AND privacy_draft_status IS NOT NULL
    AND privacy_draft_status IN ('pending', 'ready', 'failed')
    AND (privacy_draft_status <> 'ready' OR (ocr_image_key IS NOT NULL AND ocr_image_sha256 IS NOT NULL)))
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.enforce_document_privacy_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF OLD.privacy_approved_at IS NOT NULL AND
    ROW(NEW.original_key, NEW.ocr_image_key, NEW.ocr_image_sha256,
        NEW.privacy_approved_by, NEW.privacy_approved_at,
        NEW.privacy_draft_id, NEW.privacy_draft_status)
    IS DISTINCT FROM
    ROW(OLD.original_key, OLD.ocr_image_key, OLD.ocr_image_sha256,
        OLD.privacy_approved_by, OLD.privacy_approved_at,
        OLD.privacy_draft_id, OLD.privacy_draft_status)
  THEN
    RAISE EXCEPTION 'document_privacy_immutable'
      USING ERRCODE = '23514', CONSTRAINT = 'source_documents_privacy_immutable';
  END IF;
  RETURN NEW;
END;
$$;
