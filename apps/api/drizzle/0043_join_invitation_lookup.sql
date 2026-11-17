-- Tra cứu trước khi người nhận có nhà. Không cấp SELECT hash hoặc quyền ghi ngoài RLS.
-- Đây chỉ là tra cứu; T3 phải khoá và kiểm lại trạng thái/hạn khi claim trong transaction.
CREATE FUNCTION public.lookup_join_invitation(token_digest text)
RETURNS TABLE(id uuid, family_id uuid, role text, status text)
LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT i.id, i.family_id, i.role, 'pending'::text
  FROM public.family_invitations AS i
  WHERE i.kind = 'join_family'
    AND (i.token_hash = token_digest OR i.code_hash = token_digest)
    AND i.accepted_at IS NULL AND i.revoked_at IS NULL
    AND i.expires_at > clock_timestamp()
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.lookup_join_invitation(text) FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE app_role text := current_user || '_app';
BEGIN
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.lookup_join_invitation(text) TO %I', app_role);
END $$;
