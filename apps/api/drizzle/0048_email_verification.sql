CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "pending_email" text;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_verification_tokens_account_id_idx" ON "email_verification_tokens" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_expires_at_idx" ON "email_verification_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_verified_email_unique" ON "accounts" USING btree (lower("email")) WHERE "accounts"."email_verified_at" IS NOT NULL;