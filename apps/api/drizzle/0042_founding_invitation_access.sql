-- SPEC-064: đường found_family tối thiểu; join_family giữ cho E27-S3-T2/T3.
CREATE FUNCTION public.lookup_founding_invitation(token_digest text)
RETURNS TABLE(id uuid)
LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT i.id FROM public.family_invitations AS i
  WHERE i.kind = 'found_family' AND i.token_hash = token_digest
    AND i.accepted_at IS NULL AND i.revoked_at IS NULL
    AND i.expires_at > clock_timestamp()
  FOR UPDATE OF i
$$;
--> statement-breakpoint
CREATE FUNCTION public.accept_founding_invitation(token_digest text, recipient_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE invitation_id uuid;
BEGIN
  -- Cùng thứ tự khoá với application: account trước, lời mời sau.
  PERFORM 1 FROM public.accounts AS a
    WHERE a.id = recipient_id AND a.family_id IS NULL AND a.locked_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT i.id INTO invitation_id FROM public.family_invitations AS i
    WHERE i.kind = 'found_family' AND i.token_hash = token_digest
      AND i.accepted_at IS NULL AND i.revoked_at IS NULL
      AND i.expires_at > clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  -- Kiểm hạn lại sau khi chờ khoá; không đánh dấu một token vừa hết hạn.
  UPDATE public.family_invitations SET accepted_at = clock_timestamp(), accepted_by = recipient_id
    WHERE id = invitation_id AND expires_at > clock_timestamp();
  RETURN FOUND;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.lookup_founding_invitation(text),
  public.accept_founding_invitation(text, uuid) FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE app_role text := current_user || '_app';
BEGIN
  -- Giữ SELECT cột cần cho quản lý lời mời trong nhà; không cấp đọc hash cho runtime.
  EXECUTE format('REVOKE SELECT ON public.family_invitations FROM %I', app_role);
  EXECUTE format('GRANT SELECT (id,kind,family_id,role,created_by,created_at,expires_at,revoked_at,accepted_at,accepted_by) ON public.family_invitations TO %I', app_role);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.lookup_founding_invitation(text), public.accept_founding_invitation(text,uuid) TO %I', app_role);
END $$;
