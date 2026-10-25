ALTER TABLE "accounts" ADD CONSTRAINT "accounts_id_family_unique" UNIQUE("id","family_id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_id_account_unique" UNIQUE("id","account_id");--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"endpoint_hash" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_hash_unique" UNIQUE("endpoint_hash"),
	CONSTRAINT "push_subscriptions_session_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_account_family_fk" FOREIGN KEY ("account_id","family_id") REFERENCES "public"."accounts"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_session_account_fk" FOREIGN KEY ("session_id","account_id") REFERENCES "public"."sessions"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "push_subscriptions_account_idx" ON "push_subscriptions" USING btree ("account_id");--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "push_subscriptions" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);