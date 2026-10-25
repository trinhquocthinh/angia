-- UNIQUE (id, family_id) trên reminders phải có trước FK ghép từ reminder_deliveries (rà tay sau drizzle-kit).
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_id_family_unique" UNIQUE("id","family_id");--> statement-breakpoint
CREATE TABLE "reminder_deliveries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"reminder_id" uuid NOT NULL,
	"push_subscription_id" uuid,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_error" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminder_deliveries_reminder_device_unique" UNIQUE("reminder_id","push_subscription_id"),
	CONSTRAINT "reminder_deliveries_status_valid" CHECK ("reminder_deliveries"."status" IN ('pending', 'accepted', 'gone', 'failed', 'expired', 'revoked')),
	CONSTRAINT "reminder_deliveries_attempts_valid" CHECK ("reminder_deliveries"."attempts" BETWEEN 0 AND 6)
);
--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_push_subscription_id_push_subscriptions_id_fk" FOREIGN KEY ("push_subscription_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_reminder_family_fk" FOREIGN KEY ("reminder_id","family_id") REFERENCES "public"."reminders"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reminder_deliveries_pending_idx" ON "reminder_deliveries" USING btree ("next_attempt_at") WHERE "reminder_deliveries"."status" = 'pending';--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "reminder_deliveries" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);