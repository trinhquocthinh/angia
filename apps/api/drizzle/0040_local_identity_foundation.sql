CREATE TABLE "account_credentials" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"credential_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_credentials_version_positive" CHECK ("account_credentials"."credential_version" > 0),
	CONSTRAINT "account_credentials_hash_phc" CHECK ("account_credentials"."password_hash" ~ '^[$]argon2id[$]v=19[$]m=[1-9][0-9]*,t=[1-9][0-9]*,p=[1-9][0-9]*[$][A-Za-z0-9+/]+[$][A-Za-z0-9+/]+$')
);
--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_ref" text NOT NULL,
	"version_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_acceptances_account_version_unique" UNIQUE("account_ref","version_id")
);
--> statement-breakpoint
CREATE TABLE "legal_document_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"version" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"material" boolean NOT NULL,
	"content_path" text NOT NULL,
	"sha256" text NOT NULL,
	CONSTRAINT "legal_document_versions_kind_version_unique" UNIQUE("kind","version"),
	CONSTRAINT "legal_document_versions_kind_valid" CHECK ("legal_document_versions"."kind" IN ('terms', 'privacy')),
	CONSTRAINT "legal_document_versions_sha256_valid" CHECK ("legal_document_versions"."sha256" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key_hash" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_buckets_key_hash_window_start_pk" PRIMARY KEY("key_hash","window_start"),
	CONSTRAINT "rate_limit_buckets_count_nonnegative" CHECK ("rate_limit_buckets"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "oidc_subject" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "username_normalized" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "legal_ref" text DEFAULT gen_random_uuid()::text NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "temp_password_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "lock_reason" text;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "auth_method" text DEFAULT 'oidc' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "auth_method" text DEFAULT 'oidc' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "oidc_auth_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "password_change_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "account_credentials" ADD CONSTRAINT "account_credentials_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_version_id_legal_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."legal_document_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "legal_document_versions_current_idx" ON "legal_document_versions" USING btree ("kind","published_at");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_window_start_idx" ON "rate_limit_buckets" USING btree ("window_start");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_username_normalized_unique" UNIQUE("username_normalized");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_legal_ref_unique" UNIQUE("legal_ref");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_username_normalized_valid" CHECK ("accounts"."username_normalized" ~ '^[a-z0-9._-]{3,32}$');--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_auth_method_valid" CHECK ("push_subscriptions"."auth_method" IN ('local', 'oidc'));--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_auth_method_valid" CHECK ("sessions"."auth_method" IN ('local', 'oidc'));
--> statement-breakpoint
-- Ngoại lệ default privileges: runtime chỉ được thêm/đọc lịch sử đồng ý.
REVOKE ALL PRIVILEGES ON TABLE public.legal_acceptances FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.legal_acceptances FROM %I', current_user || '_app');
  EXECUTE format('GRANT SELECT, INSERT ON TABLE public.legal_acceptances TO %I', current_user || '_app');
END
$$;
