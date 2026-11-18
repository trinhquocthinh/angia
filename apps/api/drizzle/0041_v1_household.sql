CREATE TABLE "admin_audit_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_account_id" text NOT NULL,
	"family_id" uuid,
	"target_account_id" uuid,
	"target_profile_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "admin_audit_events_metadata_object" CHECK (jsonb_typeof("admin_audit_events"."metadata") = 'object'),
	CONSTRAINT "admin_audit_events_actor_valid" CHECK ("admin_audit_events"."actor_account_id" = 'system_admin' OR "admin_audit_events"."actor_account_id" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
);
--> statement-breakpoint
CREATE TABLE "family_deletion_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"execute_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"cancel_reason" text,
	CONSTRAINT "family_deletion_requests_status_valid" CHECK ("family_deletion_requests"."status" IN ('pending','revoked','executed')),
	CONSTRAINT "family_deletion_requests_terminal_complete" CHECK (("family_deletion_requests"."status" = 'pending' AND "family_deletion_requests"."revoked_at" IS NULL AND "family_deletion_requests"."executed_at" IS NULL AND "family_deletion_requests"."cancel_reason" IS NULL) OR ("family_deletion_requests"."status" = 'revoked' AND "family_deletion_requests"."revoked_at" IS NOT NULL AND "family_deletion_requests"."executed_at" IS NULL) OR ("family_deletion_requests"."status" = 'executed' AND "family_deletion_requests"."executed_at" IS NOT NULL AND "family_deletion_requests"."revoked_at" IS NULL AND "family_deletion_requests"."cancel_reason" IS NULL)),
	CONSTRAINT "family_deletion_requests_execution_after_creation" CHECK ("family_deletion_requests"."execute_at" > "family_deletion_requests"."created_at")
);
--> statement-breakpoint
ALTER TABLE "family_deletion_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "family_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"family_id" uuid,
	"role" text,
	"token_hash" text NOT NULL,
	"code_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	CONSTRAINT "family_invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "family_invitations_code_hash_unique" UNIQUE("code_hash"),
	CONSTRAINT "family_invitations_kind_shape" CHECK (("family_invitations"."kind" = 'join_family' AND "family_invitations"."family_id" IS NOT NULL AND "family_invitations"."role" IS NOT NULL AND "family_invitations"."role" IN ('main','member')) OR ("family_invitations"."kind" = 'found_family' AND "family_invitations"."family_id" IS NULL AND "family_invitations"."role" IS NULL)),
	CONSTRAINT "family_invitations_acceptance_complete" CHECK (("family_invitations"."accepted_at" IS NULL) = ("family_invitations"."accepted_by" IS NULL)),
	CONSTRAINT "family_invitations_terminal_exclusive" CHECK ("family_invitations"."accepted_at" IS NULL OR "family_invitations"."revoked_at" IS NULL),
	CONSTRAINT "family_invitations_expiry_valid" CHECK ("family_invitations"."expires_at" > "family_invitations"."created_at")
);
--> statement-breakpoint
ALTER TABLE "family_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ownership_transfer_offers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"from_account_id" uuid NOT NULL,
	"to_account_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "ownership_transfer_offers_status_valid" CHECK ("ownership_transfer_offers"."status" IN ('pending','accepted','declined','revoked')),
	CONSTRAINT "ownership_transfer_offers_distinct_accounts" CHECK ("ownership_transfer_offers"."from_account_id" <> "ownership_transfer_offers"."to_account_id"),
	CONSTRAINT "ownership_transfer_offers_decision_complete" CHECK (("ownership_transfer_offers"."status" = 'pending') = ("ownership_transfer_offers"."decided_at" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "ownership_transfer_offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_guardians" (
	"health_profile_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_guardians_health_profile_id_account_id_pk" PRIMARY KEY("health_profile_id","account_id")
);
--> statement-breakpoint
ALTER TABLE "profile_guardians" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "removed_member_windows" (
	"account_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"health_profile_id" uuid,
	"removed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "removed_member_windows_account_id_family_id_pk" PRIMARY KEY("account_id","family_id"),
	CONSTRAINT "removed_member_windows_expiry_valid" CHECK ("removed_member_windows"."expires_at" = "removed_member_windows"."removed_at" + interval '168 hours')
);
--> statement-breakpoint
ALTER TABLE "removed_member_windows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "owner_account_id" uuid;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "last_member_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "family_deletion_requests" ADD CONSTRAINT "family_deletion_requests_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_deletion_requests" ADD CONSTRAINT "family_deletion_requests_requested_by_accounts_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_invitations" ADD CONSTRAINT "family_invitations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_invitations" ADD CONSTRAINT "family_invitations_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_invitations" ADD CONSTRAINT "family_invitations_accepted_by_accounts_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer_offers" ADD CONSTRAINT "ownership_transfer_offers_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer_offers" ADD CONSTRAINT "ownership_transfer_offers_from_account_id_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer_offers" ADD CONSTRAINT "ownership_transfer_offers_to_account_id_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_guardians" ADD CONSTRAINT "profile_guardians_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_guardians" ADD CONSTRAINT "profile_guardians_health_profile_id_family_id_health_profiles_id_family_id_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_guardians" ADD CONSTRAINT "profile_guardians_account_id_family_id_accounts_id_family_id_fk" FOREIGN KEY ("account_id","family_id") REFERENCES "public"."accounts"("id","family_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "removed_member_windows" ADD CONSTRAINT "removed_member_windows_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "removed_member_windows" ADD CONSTRAINT "removed_member_windows_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "removed_member_windows" ADD CONSTRAINT "removed_member_windows_health_profile_id_family_id_health_profiles_id_family_id_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_events_occurred_at_idx" ON "admin_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "admin_audit_events_family_id_idx" ON "admin_audit_events" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "family_deletion_requests_pending_unique" ON "family_deletion_requests" USING btree ("family_id") WHERE "family_deletion_requests"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "ownership_transfer_offers_pending_unique" ON "ownership_transfer_offers" USING btree ("family_id") WHERE "ownership_transfer_offers"."status" = 'pending';--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "family_deletion_requests" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "family_invitations" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "ownership_transfer_offers" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "profile_guardians" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "removed_member_windows" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid AND NULLIF(current_setting('app.self_profile_id', true), '') IS NULL);--> statement-breakpoint
-- Chỉ kiểm tra nội bộ trong trigger; không cung cấp đường đọc dữ liệu cho app.
CREATE FUNCTION public.check_family_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE f record;
BEGIN
  IF TG_TABLE_NAME = 'families' AND TG_OP = 'UPDATE' THEN
    IF OLD.owner_account_id IS NOT NULL AND NEW.owner_account_id IS NULL THEN
      RAISE EXCEPTION 'Không được bỏ Chủ hộ đã gán' USING ERRCODE = '23514';
    END IF;
  END IF;
  FOR f IN SELECT id, owner_account_id FROM public.families
    WHERE (TG_TABLE_NAME = 'families' AND id = (to_jsonb(NEW)->>'id')::uuid)
       OR (TG_TABLE_NAME = 'accounts' AND owner_account_id = (to_jsonb(OLD)->>'id')::uuid)
    ORDER BY id FOR UPDATE
  LOOP
    IF f.owner_account_id IS NOT NULL THEN
      UPDATE public.accounts SET id = id WHERE id = f.owner_account_id
        AND family_id = f.id AND family_role = 'main';
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Chủ hộ phải là main cùng nhà' USING ERRCODE = '23514';
      END IF;
    END IF;
  END LOOP;
  RETURN NULL;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER families_owner_valid AFTER INSERT OR UPDATE ON public.families
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_family_owner();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER accounts_owner_valid AFTER UPDATE ON public.accounts
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  WHEN (OLD.family_id IS DISTINCT FROM NEW.family_id OR OLD.family_role IS DISTINCT FROM NEW.family_role)
  EXECUTE FUNCTION public.check_family_owner();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER accounts_owner_deleted AFTER DELETE ON public.accounts
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_family_owner();
--> statement-breakpoint
CREATE FUNCTION public.validate_profile_guardians(profile_id uuid, require_guardian boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE p record; guardian record; total integer; eligible boolean;
BEGIN
  SELECT * INTO p FROM public.health_profiles WHERE id = profile_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  eligible := COALESCE(extract(year FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - p.birth_year < 18, false)
    AND NOT EXISTS (SELECT 1 FROM public.accounts WHERE health_profile_id = p.id);
  SELECT count(*) INTO total FROM public.profile_guardians WHERE health_profile_id = p.id;
  IF total > 2 OR (total > 0 AND NOT eligible) OR (require_guardian AND eligible AND total = 0) THEN
    RAISE EXCEPTION 'Hồ sơ cần từ một đến hai người giám hộ hợp lệ' USING ERRCODE = '23514';
  END IF;
  -- Ghi phiên bản hàng: snapshot cũ phải lỗi serialization thay vì bỏ sót tư cách mới.
  FOR guardian IN SELECT account_id FROM public.profile_guardians WHERE health_profile_id = p.id ORDER BY account_id
  LOOP
    UPDATE public.accounts SET id = id WHERE id = guardian.account_id;
  END LOOP;
  IF EXISTS (SELECT 1 FROM public.profile_guardians g LEFT JOIN public.accounts a ON a.id = g.account_id
    WHERE g.health_profile_id = p.id AND (g.family_id <> p.family_id OR a.family_id IS DISTINCT FROM p.family_id
      OR a.family_role IS DISTINCT FROM 'main' OR a.id IS NULL)) THEN
    RAISE EXCEPTION 'Người giám hộ phải là main cùng nhà' USING ERRCODE = '23514';
  END IF;
END $$;
--> statement-breakpoint
CREATE FUNCTION public.lock_guardian_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.health_profile_id, OLD.family_id, OLD.account_id)
    IS DISTINCT FROM (NEW.health_profile_id, NEW.family_id, NEW.account_id) THEN
    RAISE EXCEPTION 'Thay người giám hộ bằng xoá và thêm trong cùng transaction' USING ERRCODE = '23514';
  END IF;
  -- Không đổi giá trị nghiệp vụ; phiên bản mới ngăn snapshot REPEATABLE READ vượt trần.
  UPDATE public.health_profiles SET id = id
    WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.health_profile_id ELSE NEW.health_profile_id END;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
--> statement-breakpoint
CREATE TRIGGER profile_guardians_lock BEFORE INSERT OR UPDATE OR DELETE ON public.profile_guardians
  FOR EACH ROW EXECUTE FUNCTION public.lock_guardian_profile();
--> statement-breakpoint
CREATE FUNCTION public.check_guardian_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_OP <> 'DELETE' THEN PERFORM public.validate_profile_guardians(NEW.health_profile_id, false); END IF;
  IF TG_OP = 'DELETE' THEN PERFORM public.validate_profile_guardians(OLD.health_profile_id, true); END IF;
  RETURN NULL;
END $$;
--> statement-breakpoint
-- Kiểm trần ngay sau INSERT để snapshot sau khoá thấy lần INSERT đã commit của transaction cạnh tranh.
CREATE TRIGGER profile_guardians_capacity AFTER INSERT OR UPDATE ON public.profile_guardians
  FOR EACH ROW EXECUTE FUNCTION public.check_guardian_change();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER profile_guardians_last AFTER DELETE ON public.profile_guardians
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_guardian_change();
--> statement-breakpoint
CREATE FUNCTION public.check_guardian_parent_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE p record;
BEGIN
  IF TG_TABLE_NAME = 'health_profiles' THEN
    PERFORM public.validate_profile_guardians(NEW.id, false);
  ELSE
    FOR p IN SELECT health_profile_id AS id FROM public.profile_guardians WHERE account_id = COALESCE((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid)
      UNION SELECT (to_jsonb(NEW)->>'health_profile_id')::uuid
      UNION SELECT (to_jsonb(OLD)->>'health_profile_id')::uuid
    LOOP
      IF p.id IS NOT NULL THEN
        UPDATE public.health_profiles SET id = id WHERE id = p.id;
        PERFORM public.validate_profile_guardians(p.id, false);
      END IF;
    END LOOP;
  END IF;
  RETURN NULL;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER accounts_guardians_valid AFTER UPDATE ON public.accounts
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  WHEN (OLD.family_id IS DISTINCT FROM NEW.family_id OR OLD.family_role IS DISTINCT FROM NEW.family_role
    OR OLD.health_profile_id IS DISTINCT FROM NEW.health_profile_id)
  EXECUTE FUNCTION public.check_guardian_parent_change();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER accounts_guardians_insert_delete AFTER INSERT OR DELETE ON public.accounts
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_guardian_parent_change();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER health_profiles_guardians_valid AFTER UPDATE ON public.health_profiles
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_guardian_parent_change();
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.check_family_owner(), public.validate_profile_guardians(uuid, boolean),
  public.lock_guardian_profile(), public.check_guardian_change(), public.check_guardian_parent_change() FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON public.admin_audit_events FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE format('REVOKE ALL ON public.admin_audit_events FROM %I', current_user || '_app');
  EXECUTE format('GRANT INSERT ON public.admin_audit_events TO %I', current_user || '_app');
END $$;
