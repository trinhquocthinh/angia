CREATE TABLE "object_purges" (
	"object_key" text PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
ALTER TABLE "object_purges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "source_documents" DROP CONSTRAINT "source_documents_ocr_image_complete";--> statement-breakpoint
ALTER TABLE "source_documents" DROP CONSTRAINT "source_documents_privacy_draft_complete";--> statement-breakpoint
ALTER TABLE "source_documents" DROP CONSTRAINT "source_documents_status_valid";--> statement-breakpoint
ALTER TABLE "source_documents" DROP CONSTRAINT "source_documents_privacy_approval_complete";--> statement-breakpoint
ALTER TABLE "source_documents" ADD COLUMN "image_key" text;--> statement-breakpoint
ALTER TABLE "source_documents" ADD COLUMN "image_sha256" text;--> statement-breakpoint
ALTER TABLE "object_purges" ADD CONSTRAINT "object_purges_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "object_purges_family_idx" ON "object_purges" USING btree ("family_id");--> statement-breakpoint
DO $$
DECLARE
  rejected_count bigint;
  unapproved_count bigint;
  approved_count bigint;
  retained_count bigint;
BEGIN
  SELECT count(*) FILTER (WHERE status = 'rejected'),
         count(*) FILTER (WHERE status IN ('uploaded', 'awaiting_privacy') AND privacy_approved_at IS NULL),
         count(*) FILTER (WHERE status <> 'rejected' AND privacy_approved_at IS NOT NULL),
         count(*) FILTER (WHERE status NOT IN ('rejected', 'uploaded', 'awaiting_privacy') AND privacy_approved_at IS NULL)
  INTO rejected_count, unapproved_count, approved_count, retained_count
  FROM public.source_documents;
  RAISE NOTICE 'KH-2 migration: rejected=%, unapproved_pending=%, approved=%, retained_without_image=%',
    rejected_count, unapproved_count, approved_count, retained_count;
  IF EXISTS (
    SELECT 1 FROM public.source_documents
    WHERE status IN ('uploaded', 'awaiting_privacy') AND privacy_approved_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'KH-2 migration: approved document in obsolete pending state';
  END IF;
END;
$$;--> statement-breakpoint
INSERT INTO public.object_purges (object_key, family_id)
SELECT DISTINCT ON (keys.object_key) keys.object_key, d.family_id
FROM public.source_documents d
CROSS JOIN LATERAL (
  VALUES (d.original_key), (d.preview_key),
    (CASE WHEN d.status = 'rejected' OR d.privacy_approved_at IS NULL
      THEN d.ocr_image_key ELSE NULL END)
) AS keys(object_key)
WHERE keys.object_key IS NOT NULL
ORDER BY keys.object_key
ON CONFLICT (object_key) DO NOTHING;--> statement-breakpoint
UPDATE public.source_documents
SET image_key = ocr_image_key, image_sha256 = ocr_image_sha256
WHERE status <> 'rejected' AND privacy_approved_at IS NOT NULL;--> statement-breakpoint
DELETE FROM public.source_documents
WHERE status = 'rejected'
   OR (status IN ('uploaded', 'awaiting_privacy') AND privacy_approved_at IS NULL);--> statement-breakpoint
DELETE FROM pgboss.job WHERE name IN ('convert-heic', 'prepare-ocr-image');--> statement-breakpoint
DROP TRIGGER source_documents_privacy_immutable ON public.source_documents;--> statement-breakpoint
DROP FUNCTION public.enforce_document_privacy_immutable();--> statement-breakpoint
ALTER TABLE "source_documents" DROP COLUMN "original_key";--> statement-breakpoint
ALTER TABLE "source_documents" DROP COLUMN "preview_key";--> statement-breakpoint
ALTER TABLE "source_documents" DROP COLUMN "privacy_draft_id";--> statement-breakpoint
ALTER TABLE "source_documents" DROP COLUMN "privacy_draft_status";--> statement-breakpoint
ALTER TABLE "source_documents" DROP COLUMN "ocr_image_key";--> statement-breakpoint
ALTER TABLE "source_documents" DROP COLUMN "ocr_image_sha256";--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_image_complete" CHECK (("source_documents"."image_key" IS NULL AND "source_documents"."image_sha256" IS NULL)
        OR ("source_documents"."image_key" IS NOT NULL
          AND char_length(btrim("source_documents"."image_key")) > 0
          AND "source_documents"."image_key" = btrim("source_documents"."image_key")
          AND (("source_documents"."status" = 'uploaded' AND "source_documents"."image_sha256" IS NULL)
            OR COALESCE("source_documents"."image_sha256" ~ '^[0-9a-f]{64}$', false))));--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_status_valid" CHECK ("source_documents"."status" IN ('uploaded', 'extracting', 'pending_review', 'approved', 'manual_entry', 'awaiting_budget'));--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_privacy_approval_complete" CHECK (("source_documents"."privacy_approved_by" IS NULL AND "source_documents"."privacy_approved_at" IS NULL)
        OR ("source_documents"."privacy_approved_by" IS NOT NULL AND "source_documents"."privacy_approved_at" IS NOT NULL
          AND isfinite("source_documents"."privacy_approved_at")));--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "object_purges" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
CREATE FUNCTION public.enforce_document_image_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF OLD.privacy_approved_at IS NOT NULL AND
     ROW(NEW.privacy_approved_by, NEW.privacy_approved_at) IS DISTINCT FROM
     ROW(OLD.privacy_approved_by, OLD.privacy_approved_at) THEN
    RAISE EXCEPTION 'document_privacy_immutable'
      USING ERRCODE = '23514', CONSTRAINT = 'source_documents_image_immutable';
  END IF;
  IF OLD.image_sha256 IS NOT NULL AND
     ROW(NEW.image_key, NEW.image_sha256) IS DISTINCT FROM
     ROW(OLD.image_key, OLD.image_sha256) AND
     NOT (NEW.image_key IS NULL AND NEW.image_sha256 IS NULL) THEN
    RAISE EXCEPTION 'document_image_immutable'
      USING ERRCODE = '23514', CONSTRAINT = 'source_documents_image_immutable';
  END IF;
  IF OLD.image_key IS NULL AND OLD.status <> 'uploaded' AND NEW.image_key IS NOT NULL THEN
    RAISE EXCEPTION 'document_image_immutable'
      USING ERRCODE = '23514', CONSTRAINT = 'source_documents_image_immutable';
  END IF;
  IF OLD.image_key IS NOT NULL AND OLD.image_sha256 IS NULL AND
     NEW.image_key IS DISTINCT FROM OLD.image_key AND
     NOT (NEW.image_key IS NULL AND NEW.image_sha256 IS NULL) AND
     NOT (NEW.image_sha256 IS NOT NULL AND NEW.status IN ('extracting', 'manual_entry')) THEN
    RAISE EXCEPTION 'document_image_immutable'
      USING ERRCODE = '23514', CONSTRAINT = 'source_documents_image_immutable';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER source_documents_image_immutable
BEFORE UPDATE ON public.source_documents
FOR EACH ROW EXECUTE FUNCTION public.enforce_document_image_immutable();
