CREATE TABLE "deleted_usernames" (
	"username_hash" text PRIMARY KEY NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_deleted_anonymized" CHECK ("accounts"."deleted_at" IS NULL OR ("accounts"."username_normalized" IS NULL AND "accounts"."email" IS NULL AND "accounts"."pending_email" IS NULL AND "accounts"."oidc_subject" IS NULL AND "accounts"."family_id" IS NULL AND "accounts"."health_profile_id" IS NULL AND "accounts"."display_name" = '' AND NOT "accounts"."is_system_admin"));--> statement-breakpoint
REVOKE ALL ON public.deleted_usernames FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  -- API ghi khi xoá và tra khi đăng ký; worker (cùng role app) xoá dòng quá 90 ngày. Không UPDATE.
  EXECUTE format('REVOKE ALL ON public.deleted_usernames FROM %I', current_user || '_app');
  EXECUTE format('GRANT SELECT, INSERT, DELETE ON public.deleted_usernames TO %I', current_user || '_app');
END $$;
--> statement-breakpoint
-- SPEC-073: dòng còn sót ở nhà cũ (cửa sổ người bị gỡ, người nhận nhắc, Push) nằm ngoài RLS của phiên.
-- Chỉ chạy cho tài khoản đã thành bia mộ trong cùng transaction; chỉ xoá dòng của chính tài khoản đó.
CREATE FUNCTION public.purge_deleted_account_rows(target_account uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  PERFORM 1 FROM public.accounts AS a WHERE a.id = target_account AND a.deleted_at IS NOT NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'account is not deleted' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.removed_member_windows WHERE account_id = target_account;
  DELETE FROM public.reminder_recipients WHERE account_id = target_account;
  DELETE FROM public.push_subscriptions WHERE account_id = target_account;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.purge_deleted_account_rows(uuid) FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.purge_deleted_account_rows(uuid) TO %I', current_user || '_app');
END $$;
