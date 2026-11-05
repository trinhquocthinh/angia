CREATE TABLE "revisit_reminders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid NOT NULL,
	"revisit_date" date NOT NULL,
	"offset_kind" text NOT NULL,
	"send_date" date NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revisit_reminders_profile_date_offset_unique" UNIQUE("health_profile_id","revisit_date","offset_kind"),
	CONSTRAINT "revisit_reminders_id_family_unique" UNIQUE("id","family_id"),
	CONSTRAINT "revisit_reminders_send_date_valid" CHECK (("revisit_reminders"."offset_kind" = 'two_days_before' AND "revisit_reminders"."send_date" = "revisit_reminders"."revisit_date" - 2)
        OR ("revisit_reminders"."offset_kind" = 'same_day' AND "revisit_reminders"."send_date" = "revisit_reminders"."revisit_date"))
);
--> statement-breakpoint
ALTER TABLE "revisit_reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ALTER COLUMN "reminder_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "revisit_date" date;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD COLUMN "revisit_reminder_id" uuid;--> statement-breakpoint
ALTER TABLE "revisit_reminders" ADD CONSTRAINT "revisit_reminders_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisit_reminders" ADD CONSTRAINT "revisit_reminders_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "revisit_reminders_unsent_scheduled_idx" ON "revisit_reminders" USING btree ("scheduled_at") WHERE "revisit_reminders"."sent_at" IS NULL;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_revisit_family_fk" FOREIGN KEY ("revisit_reminder_id","family_id") REFERENCES "public"."revisit_reminders"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prescriptions_profile_revisit_idx" ON "prescriptions" USING btree ("health_profile_id","revisit_date") WHERE "prescriptions"."revisit_date" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_revisit_device_unique" UNIQUE("revisit_reminder_id","push_subscription_id");--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_revisit_date_valid" CHECK ("prescriptions"."revisit_date" IS NULL OR ("prescriptions"."revisit_date" >= "prescriptions"."issued_date" AND "prescriptions"."revisit_date" <= "prescriptions"."issued_date" + 3650));--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_one_reminder" CHECK (num_nonnulls("reminder_deliveries"."reminder_id", "reminder_deliveries"."revisit_reminder_id") = 1);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "revisit_reminders" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);