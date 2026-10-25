ALTER TABLE "health_profiles" DROP CONSTRAINT "health_profiles_consent_status_valid";--> statement-breakpoint
ALTER TABLE "consent_invitations" ADD COLUMN "inviter_attested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD COLUMN "consent_withdrawn_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD COLUMN "consent_withdrawn_by" uuid;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_consent_withdrawn_by_accounts_id_fk" FOREIGN KEY ("consent_withdrawn_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_withdrawn_receipt_complete" CHECK ("health_profiles"."consent_status" <> 'withdrawn' OR "health_profiles"."consent_withdrawn_at" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_consent_status_valid" CHECK ("health_profiles"."consent_status" IN ('pending', 'invited', 'declined', 'confirmed', 'withdrawn'));