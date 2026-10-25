CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"date" date NOT NULL,
	"slot" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"medications" jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminders_profile_date_slot_unique" UNIQUE("health_profile_id","date","slot"),
	CONSTRAINT "reminders_slot_valid" CHECK ("reminders"."slot" IN ('morning', 'noon', 'afternoon', 'evening')),
	CONSTRAINT "reminders_medications_nonempty" CHECK (jsonb_typeof("reminders"."medications") = 'array' AND jsonb_array_length("reminders"."medications") >= 1)
);
--> statement-breakpoint
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reminders_unsent_scheduled_idx" ON "reminders" USING btree ("scheduled_at") WHERE "reminders"."sent_at" IS NULL;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "reminders" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);