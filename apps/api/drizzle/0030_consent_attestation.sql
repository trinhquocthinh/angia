ALTER TABLE "health_profiles" DROP CONSTRAINT "health_profiles_consent_source_valid";--> statement-breakpoint
ALTER TABLE "health_profiles" DROP CONSTRAINT "health_profiles_confirmed_receipt_complete";--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_main_attested_receipt_complete" CHECK ("health_profiles"."consent_source" IS DISTINCT FROM 'main_attested' OR (
        "health_profiles"."consent_confirmed_by" IS NOT NULL
        AND "health_profiles"."consent_basis" IS NOT NULL
        AND "health_profiles"."consent_respondent_name" IS NOT NULL
      ));--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_consent_source_valid" CHECK ("health_profiles"."consent_source" IN ('legacy_attestation', 'invitation', 'main_attested', 'self'));--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_confirmed_receipt_complete" CHECK ("health_profiles"."consent_status" <> 'confirmed' OR COALESCE((
        "health_profiles"."consent_confirmed_at" IS NOT NULL
        AND "health_profiles"."consent_basis" IS NOT NULL
        AND "health_profiles"."consent_respondent_name" IS NOT NULL
        AND char_length(btrim("health_profiles"."consent_respondent_name")) BETWEEN 1 AND 60
        AND "health_profiles"."consent_respondent_name" = btrim("health_profiles"."consent_respondent_name")
        AND (
          ("health_profiles"."consent_source" = 'invitation' AND "health_profiles"."consent_confirmed_by" IS NULL)
          OR ("health_profiles"."consent_source" = 'main_attested' AND "health_profiles"."consent_confirmed_by" IS NOT NULL)
          OR ("health_profiles"."consent_source" = 'self' AND "health_profiles"."consent_confirmed_by" IS NOT NULL AND "health_profiles"."consent_basis" = 'self')
        )
      ), false));