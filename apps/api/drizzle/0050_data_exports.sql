CREATE TABLE "data_exports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"profile_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"object_key" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_exports_status_valid" CHECK ("data_exports"."status" IN ('pending', 'ready', 'failed')),
	CONSTRAINT "data_exports_ready_complete" CHECK (("data_exports"."status" = 'ready') = ("data_exports"."object_key" IS NOT NULL AND "data_exports"."expires_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_exports_account_id_idx" ON "data_exports" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "data_exports_expires_at_idx" ON "data_exports" USING btree ("expires_at");