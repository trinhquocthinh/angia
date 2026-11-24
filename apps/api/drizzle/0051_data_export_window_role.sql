-- E29-S3-T2 (SPEC-072, TC-870): role job tải về đọc hồ sơ nhà cũ của người bị gỡ trong cửa sổ 7 ngày.
-- Cùng cách 0046: NOLOGIN, NOBYPASSRLS, app SET vào (không INHERIT). Owner cần CREATEROLE hoặc role
-- NOLOGIN tạo sẵn kèm ADMIN. Worker đặt app.export_account_id = tài khoản yêu cầu và app.family_id = nhà cũ.
DO $$
DECLARE job_role text := current_user || '_data_export';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = job_role) THEN
    EXECUTE format('CREATE ROLE %I NOLOGIN NOBYPASSRLS', job_role);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = job_role AND rolcanlogin) THEN
    EXECUTE format('ALTER ROLE %I NOLOGIN', job_role);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = job_role AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'Role % không được SUPERUSER/BYPASSRLS', job_role;
  END IF;
  EXECUTE format('GRANT %I TO %I WITH INHERIT FALSE, SET TRUE', job_role, current_user || '_app');
  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', job_role);
END $$;
--> statement-breakpoint
-- Cửa sổ: chỉ của tài khoản yêu cầu và còn hạn. Permissive SELECT để job liệt kê cửa sổ khi chưa biết
-- nhà cũ (chưa có app.family_id); restrictive giữ điều kiện cả khi đã vào phạm vi nhà cũ.
-- Điều kiện tài khoản + hạn chỉ nằm ở đây; policy các bảng dữ liệu tra qua bảng này (đã bị lọc).
DO $$
DECLARE job_role text := current_user || '_data_export';
  in_window text := $w$account_id = NULLIF(current_setting('app.export_account_id', true), '')::uuid
    AND expires_at > now()$w$;
BEGIN
  EXECUTE format('GRANT SELECT ON public.removed_member_windows TO %I', job_role);
  EXECUTE 'DROP POLICY IF EXISTS data_export_window_scan ON public.removed_member_windows';
  EXECUTE format('CREATE POLICY data_export_window_scan ON public.removed_member_windows
    AS PERMISSIVE FOR SELECT TO %I USING (%s)', job_role, in_window);
  EXECUTE 'DROP POLICY IF EXISTS data_export_window_only ON public.removed_member_windows';
  EXECUTE format('CREATE POLICY data_export_window_only ON public.removed_member_windows
    AS RESTRICTIVE FOR ALL TO %I USING (%s)', job_role, in_window);
END $$;
--> statement-breakpoint
-- Bảng dữ liệu trong ZIP: chỉ SELECT, dòng phải thuộc hồ sơ của một cửa sổ nhìn thấy được.
-- Cột hồ sơ khác nhau theo bảng; UUID hồ sơ là duy nhất toàn hệ thống, nhà đã do family_isolation_policy chặn.
DO $$
DECLARE job_role text := current_user || '_data_export'; t text; col text;
BEGIN
  FOR t, col IN VALUES
    ('health_profiles', 'id'), ('medication_courses', 'health_profile_id'),
    ('prescriptions', 'health_profile_id'), ('reminders', 'health_profile_id'),
    ('reminder_recipients', 'health_profile_id'), ('dose_confirmations', 'health_profile_id'),
    ('dose_slots', 'health_profile_id'), ('as_needed_doses', 'health_profile_id'),
    ('measurements', 'health_profile_id'), ('lab_results', 'health_profile_id'),
    ('temperature_readings', 'health_profile_id'), ('revisit_reminders', 'health_profile_id'),
    ('pain_issues', 'health_profile_id'), ('pain_entries', 'health_profile_id'),
    ('exercise_notes', 'health_profile_id'), ('pain_issue_status_events', 'health_profile_id'),
    ('source_documents', 'health_profile_id'), ('adherence_periods', 'health_profile_id'),
    ('profile_guardians', 'health_profile_id'), ('consent_invitations', 'profile_id'),
    ('consent_legacy_attestations', 'profile_id'), ('profile_link_events', 'profile_id')
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO %I', t, job_role);
    EXECUTE format('DROP POLICY IF EXISTS data_export_window_only ON public.%I', t);
    EXECUTE format($f$CREATE POLICY data_export_window_only ON public.%1$I AS RESTRICTIVE FOR ALL TO %2$I
      USING (EXISTS (SELECT 1 FROM public.removed_member_windows w
        WHERE w.health_profile_id = %1$I.%3$I))$f$, t, job_role, col);
  END LOOP;
  EXECUTE format('GRANT SELECT ON public.prescription_items TO %I', job_role);
  EXECUTE 'DROP POLICY IF EXISTS data_export_window_only ON public.prescription_items';
  EXECUTE format($f$CREATE POLICY data_export_window_only ON public.prescription_items AS RESTRICTIVE
    FOR ALL TO %I USING (EXISTS (SELECT 1 FROM public.prescriptions p
      JOIN public.removed_member_windows w ON w.health_profile_id = p.health_profile_id
      WHERE p.id = prescription_items.prescription_id))$f$, job_role);
END $$;
