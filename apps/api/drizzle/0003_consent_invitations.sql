CREATE TABLE "consent_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_account_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"decision" text,
	"respondent_name" text,
	"basis" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consent_invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "consent_invitations_decision_valid" CHECK ("consent_invitations"."decision" IN ('accepted', 'declined')),
	CONSTRAINT "consent_invitations_basis_valid" CHECK ("consent_invitations"."basis" IN ('self', 'guardian')),
	CONSTRAINT "consent_invitations_response_complete" CHECK (("consent_invitations"."decision" IS NULL AND "consent_invitations"."respondent_name" IS NULL AND "consent_invitations"."basis" IS NULL AND "consent_invitations"."responded_at" IS NULL) OR ("consent_invitations"."decision" IS NOT NULL AND "consent_invitations"."respondent_name" IS NOT NULL AND "consent_invitations"."basis" IS NOT NULL AND "consent_invitations"."responded_at" IS NOT NULL)),
	CONSTRAINT "consent_invitations_name_valid" CHECK ("consent_invitations"."respondent_name" IS NULL OR (char_length(btrim("consent_invitations"."respondent_name")) BETWEEN 1 AND 60 AND "consent_invitations"."respondent_name" = btrim("consent_invitations"."respondent_name")))
);
--> statement-breakpoint
ALTER TABLE "consent_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consent_legacy_attestations" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"confirmed_by_account_id" uuid,
	"confirmed_at" timestamp with time zone NOT NULL,
	"basis" text,
	CONSTRAINT "consent_legacy_attestations_basis_valid" CHECK ("consent_legacy_attestations"."basis" IN ('self', 'guardian'))
);
--> statement-breakpoint
ALTER TABLE "consent_legacy_attestations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD COLUMN "consent_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD COLUMN "consent_source" text;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD COLUMN "consent_respondent_name" text;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_id_family_unique" UNIQUE("id","family_id");--> statement-breakpoint
ALTER TABLE "consent_invitations" ADD CONSTRAINT "consent_invitations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_invitations" ADD CONSTRAINT "consent_invitations_invited_by_account_id_accounts_id_fk" FOREIGN KEY ("invited_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_invitations" ADD CONSTRAINT "consent_invitations_profile_family_fk" FOREIGN KEY ("profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_legacy_attestations" ADD CONSTRAINT "consent_legacy_attestations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_legacy_attestations" ADD CONSTRAINT "consent_legacy_attestations_profile_family_fk" FOREIGN KEY ("profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_invitations_profile_family_idx" ON "consent_invitations" USING btree ("profile_id","family_id");--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_consent_status_valid" CHECK ("health_profiles"."consent_status" IN ('pending', 'invited', 'declined', 'confirmed'));--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_consent_source_valid" CHECK ("health_profiles"."consent_source" IN ('legacy_attestation', 'invitation'));--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "consent_invitations" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "consent_legacy_attestations" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);
--> statement-breakpoint
INSERT INTO consent_legacy_attestations (profile_id, family_id, confirmed_by_account_id, confirmed_at, basis)
SELECT id, family_id, consent_confirmed_by, consent_confirmed_at, consent_basis
FROM health_profiles WHERE consent_confirmed_at IS NOT NULL;
--> statement-breakpoint
UPDATE health_profiles SET consent_source = 'legacy_attestation', consent_status = 'pending'
WHERE consent_confirmed_at IS NOT NULL;

--> statement-breakpoint
ALTER TABLE health_profiles ADD CONSTRAINT health_profiles_confirmed_receipt_complete CHECK (
 consent_status <> 'confirmed' OR (consent_source IS NOT DISTINCT FROM 'invitation' AND consent_confirmed_at IS NOT NULL
 AND consent_confirmed_by IS NULL AND consent_basis IS NOT NULL AND consent_respondent_name IS NOT NULL
 AND char_length(btrim(consent_respondent_name)) BETWEEN 1 AND 60 AND consent_respondent_name=btrim(consent_respondent_name))
);
