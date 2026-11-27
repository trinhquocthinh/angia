-- E31-S2-T1 (SPEC-076/077): SystemAdmin đọc nhật ký quản lý và thống kê không định danh.
-- Role app vẫn chỉ INSERT + SELECT theo cột trên admin_audit_events và không BYPASSRLS; hai hàm
-- SECURITY DEFINER là đường đọc riêng duy nhất (route kiểm SystemAdmin OIDC ở tầng presentation).
CREATE FUNCTION public.admin_audit_events_list(
  p_from timestamptz, p_to timestamptz, p_family_id uuid, p_account_id uuid, p_action text,
  p_before_at timestamptz, p_before_id uuid, p_limit integer)
RETURNS TABLE(id uuid, occurred_at timestamptz, actor_account_id text, family_id uuid,
  target_account_id uuid, target_profile_id uuid, action text, metadata jsonb)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT e.id, e.occurred_at, e.actor_account_id, e.family_id, e.target_account_id,
         e.target_profile_id, e.action, e.metadata
  FROM public.admin_audit_events AS e
  WHERE (p_from IS NULL OR e.occurred_at >= p_from)
    AND (p_to IS NULL OR e.occurred_at < p_to)
    AND (p_family_id IS NULL OR e.family_id = p_family_id)
    AND (p_account_id IS NULL OR e.target_account_id = p_account_id
         OR e.actor_account_id = p_account_id::text)
    AND (p_action IS NULL OR e.action = p_action)
    AND (p_before_at IS NULL OR (e.occurred_at, e.id) < (p_before_at, p_before_id))
  ORDER BY e.occurred_at DESC, e.id DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 200)
$$;
--> statement-breakpoint
-- Chỉ trả số đếm theo tuần (T2–CN, giờ Việt Nam); không id, tên hay dữ liệu sức khoẻ.
CREATE FUNCTION public.admin_weekly_stats(p_weeks integer)
RETURNS TABLE(week_start date, families integer, accounts integer,
  families_with_dose_confirmation integer, families_active_streak_4w integer)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  WITH cur AS (
    SELECT date_trunc('week', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ws
  ), weeks AS (
    SELECT (cur.ws - 7 * g)::date AS ws
    FROM cur, generate_series(0, LEAST(GREATEST(p_weeks, 1), 52) - 1) AS g
  ), active AS (
    SELECT DISTINCT d.family_id, date_trunc('week', d.date)::date AS ws
    FROM public.dose_confirmations AS d
  )
  SELECT w.ws,
    (SELECT count(*) FROM public.families AS f
       WHERE (f.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date < w.ws + 7)::integer,
    (SELECT count(*) FROM public.accounts AS a
       WHERE a.deleted_at IS NULL AND NOT a.is_system_admin
         AND (a.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date < w.ws + 7)::integer,
    (SELECT count(*) FROM active AS x WHERE x.ws = w.ws)::integer,
    (SELECT count(*) FROM (
       SELECT x.family_id FROM active AS x
       WHERE x.ws BETWEEN w.ws - 21 AND w.ws
       GROUP BY x.family_id HAVING count(*) = 4) AS s)::integer
  FROM weeks AS w
  ORDER BY w.ws DESC
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.admin_audit_events_list(timestamptz, timestamptz, uuid, uuid, text, timestamptz, uuid, integer),
  public.admin_weekly_stats(integer) FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.admin_audit_events_list(timestamptz, timestamptz, uuid, uuid, text, timestamptz, uuid, integer) TO %I',
    current_user || '_app');
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.admin_weekly_stats(integer) TO %I',
    current_user || '_app');
END $$;
