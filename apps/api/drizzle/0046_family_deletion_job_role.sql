-- E28-S2-T2 (D1, D3, D4): role job xoá nhà, chỉ chạm nhà có yêu cầu pending đã đến hạn (TC-869).
-- Role NOLOGIN, không secret; worker vào withFamilyScope rồi SET LOCAL ROLE. App không INHERIT nên
-- policy gắn role không lan sang app. Cần owner có CREATEROLE (SIT/Prod: kiểm trước khi deploy).
DO $$
DECLARE job_role text := current_user || '_family_deletion';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = job_role) THEN
    EXECUTE format('CREATE ROLE %I NOLOGIN NOBYPASSRLS', job_role);
  END IF;
  EXECUTE format('ALTER ROLE %I NOLOGIN', job_role);
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = job_role AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'Role % không được SUPERUSER/BYPASSRLS', job_role;
  END IF;
  EXECUTE format('GRANT %I TO %I WITH INHERIT FALSE, SET TRUE', job_role, current_user || '_app');
  EXECUTE format('GRANT USAGE ON SCHEMA public, pgboss TO %I', job_role);
END $$;
--> statement-breakpoint
-- D3/D4: nhật ký quota và hàng đợi vét object thành snapshot, còn lại sau khi dòng nhà bị xoá.
ALTER TABLE public.scan_quota_audit DROP CONSTRAINT IF EXISTS scan_quota_audit_family_id_families_id_fk;
--> statement-breakpoint
ALTER TABLE public.object_purges DROP CONSTRAINT IF EXISTS object_purges_family_id_families_id_fk;
--> statement-breakpoint
-- Bảng yêu cầu: policy không được tự truy vấn chính nó (đệ quy), nên điều kiện viết trực tiếp.
-- Permissive chỉ SELECT: job quét danh sách đến hạn không cần GUC; sửa thì phải trong phạm vi nhà.
-- WITH CHECK chỉ cho chuyển sang revoked (D5) với revoked_at = now(); không hoãn hạn hay đổi nhà.
-- UPDATE có WHERE buộc dòng mới qua cả USING (quy tắc SELECT của RLS), nên USING nhận thêm dòng vừa
-- huỷ trong chính transaction này (revoked_at = now()); dòng huỷ từ trước vẫn không thấy.
DO $$
DECLARE job_role text := current_user || '_family_deletion';
BEGIN
  EXECUTE format('GRANT SELECT, UPDATE ON public.family_deletion_requests TO %I', job_role);
  EXECUTE 'DROP POLICY IF EXISTS family_deletion_job_scan ON public.family_deletion_requests';
  EXECUTE format($f$CREATE POLICY family_deletion_job_scan ON public.family_deletion_requests
    AS PERMISSIVE FOR SELECT TO %I USING (status = 'pending' AND execute_at <= now())$f$, job_role);
  EXECUTE 'DROP POLICY IF EXISTS family_deletion_due_only ON public.family_deletion_requests';
  EXECUTE format($f$CREATE POLICY family_deletion_due_only ON public.family_deletion_requests
    AS RESTRICTIVE FOR ALL TO %I
    USING ((status = 'pending' AND execute_at <= now()) OR (status = 'revoked' AND revoked_at = now()))
    WITH CHECK (status = 'revoked' AND revoked_at = now())$f$, job_role);
END $$;
--> statement-breakpoint
-- Mọi bảng RLS có family_id (trừ nhật ký quota): phải đúng nhà (family_isolation_policy) VÀ nhà đến hạn.
-- object_purges chỉ INSERT (ghi khoá cần vét); policy vẫn gắn để không ghi được cho nhà chưa đến hạn.
DO $$
DECLARE job_role text := current_user || '_family_deletion'; t text;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'family_id' AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
      AND c.relname NOT IN ('scan_quota_audit', 'family_deletion_requests')
    ORDER BY c.relname
  LOOP
    EXECUTE format(CASE WHEN t = 'object_purges' THEN 'GRANT INSERT ON public.%I TO %I'
      ELSE 'GRANT SELECT, DELETE ON public.%I TO %I' END, t, job_role);
    EXECUTE format('DROP POLICY IF EXISTS family_deletion_due_only ON public.%I', t);
    EXECUTE format($f$CREATE POLICY family_deletion_due_only ON public.%1$I AS RESTRICTIVE FOR ALL TO %2$I
      USING (EXISTS (SELECT 1 FROM public.family_deletion_requests r
        WHERE r.family_id = %1$I.family_id AND r.status = 'pending' AND r.execute_at <= now()))$f$, t, job_role);
  END LOOP;
END $$;
--> statement-breakpoint
-- accounts không RLS: chỉ SELECT (BR-076 giữ tài khoản Chủ hộ); nhật ký chỉ INSERT; enqueue pg-boss
-- trong cùng transaction: pg-boss ghi thẳng vào bảng của queue (queue không partition dùng job_common,
-- không qua bảng cha pgboss.job), JOIN pgboss.queue lấy cấu hình và RETURNING id.
DO $$
DECLARE job_role text := current_user || '_family_deletion';
BEGIN
  EXECUTE format('GRANT SELECT ON public.accounts TO %I', job_role);
  EXECUTE format('GRANT INSERT ON public.admin_audit_events TO %I', job_role);
  EXECUTE format('GRANT INSERT, SELECT (id) ON pgboss.job_common TO %I', job_role);
  EXECUTE format('GRANT SELECT ON pgboss.queue TO %I', job_role);
END $$;
--> statement-breakpoint
-- Bước cuối (families không RLS): kiểm lại pending + đến hạn + chỉ còn Chủ hộ, gỡ Chủ hộ rồi xoá nhà.
-- Khoá theo thứ tự account → family → request như API. Dữ liệu nhà còn sót thì DELETE families lỗi FK.
-- Trigger deferred accounts_owner_valid chạy lúc COMMIT không còn thấy nhà nên không đòi Chủ hộ;
-- families_owner_valid không bắt DELETE.
CREATE OR REPLACE FUNCTION public.finalize_family_deletion(request_id uuid) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE target uuid; owner_id uuid;
BEGIN
  SELECT r.family_id INTO target FROM public.family_deletion_requests AS r WHERE r.id = request_id;
  PERFORM 1 FROM public.accounts AS a WHERE a.family_id = target ORDER BY a.id FOR UPDATE;
  SELECT f.owner_account_id INTO owner_id FROM public.families AS f WHERE f.id = target FOR UPDATE;
  PERFORM 1 FROM public.family_deletion_requests AS r
    WHERE r.id = request_id AND r.status = 'pending' AND r.execute_at <= now() FOR UPDATE;
  IF target IS NULL OR NOT FOUND THEN
    RAISE EXCEPTION 'Yêu cầu xoá nhà không còn chờ hoặc chưa đến hạn' USING ERRCODE = '55000';
  END IF;
  IF owner_id IS NULL OR EXISTS (SELECT 1 FROM public.accounts AS a
    WHERE a.family_id = target AND a.id <> owner_id) THEN
    RAISE EXCEPTION 'Nhà còn thành viên ngoài Chủ hộ' USING ERRCODE = '23514';
  END IF;
  UPDATE public.accounts SET family_id = NULL, family_role = NULL, health_profile_id = NULL
    WHERE id = owner_id;
  DELETE FROM public.families WHERE id = target;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.finalize_family_deletion(uuid) FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.finalize_family_deletion(uuid) TO %I',
    current_user || '_family_deletion');
END $$;
--> statement-breakpoint
-- BR-010: khoá object_purges của nhà đã xoá không còn dòng families nên job vét không liệt kê được;
-- RLS ẩn object_purges khi không có GUC. Hàm chỉ trả family_id (không khoá object), cho role app.
CREATE FUNCTION public.list_orphan_object_purge_families() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT DISTINCT p.family_id FROM public.object_purges AS p
  WHERE NOT EXISTS (SELECT 1 FROM public.families AS f WHERE f.id = p.family_id)
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.list_orphan_object_purge_families() FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.list_orphan_object_purge_families() TO %I',
    current_user || '_app');
END $$;
