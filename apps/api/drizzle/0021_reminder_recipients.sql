CREATE TABLE "reminder_recipients" (
	"health_profile_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminder_recipients_pk" PRIMARY KEY("health_profile_id","account_id")
);
--> statement-breakpoint
ALTER TABLE "reminder_recipients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reminder_recipients" ADD CONSTRAINT "reminder_recipients_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_recipients" ADD CONSTRAINT "reminder_recipients_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_recipients" ADD CONSTRAINT "reminder_recipients_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "reminder_recipients" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);