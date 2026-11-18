-- SPEC-065: lập nhà qua mã hoặc token; claim vẫn chỉ ở transaction tạo nhà.
CREATE OR REPLACE FUNCTION public.lookup_founding_invitation(token_digest text)
RETURNS TABLE(id uuid)
LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT i.id FROM public.family_invitations AS i
  WHERE i.kind = 'found_family' AND (i.token_hash = token_digest OR i.code_hash = token_digest)
    AND i.accepted_at IS NULL AND i.revoked_at IS NULL
    AND i.expires_at > clock_timestamp()
  FOR UPDATE OF i
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.accept_founding_invitation(token_digest text, recipient_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE invitation_id uuid;
BEGIN
  PERFORM 1 FROM public.accounts AS a
    WHERE a.id = recipient_id AND a.family_id IS NULL AND a.locked_at IS NULL
      AND NOT a.is_system_admin FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT i.id INTO invitation_id FROM public.family_invitations AS i
    WHERE i.kind = 'found_family' AND (i.token_hash = token_digest OR i.code_hash = token_digest)
      AND i.accepted_at IS NULL AND i.revoked_at IS NULL
      AND i.expires_at > clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.family_invitations SET accepted_at = clock_timestamp(), accepted_by = recipient_id
    WHERE id = invitation_id AND expires_at > clock_timestamp();
  RETURN FOUND;
END $$;
--> statement-breakpoint
CREATE FUNCTION public.issue_founding_invitation(actor_id uuid, new_invitation_id uuid, token_digest text, code_digest text)
RETURNS TABLE(id uuid, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE issued_at timestamptz;
BEGIN
  PERFORM 1 FROM public.accounts AS a WHERE a.id=actor_id AND a.is_system_admin
    AND a.locked_at IS NULL AND a.family_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF token_digest !~ '^[a-f0-9]{64}$' OR code_digest !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Băm lời mời không hợp lệ';
  END IF;
  issued_at := clock_timestamp();
  RETURN QUERY INSERT INTO public.family_invitations AS i
    (id,kind,token_hash,code_hash,created_by,created_at,expires_at)
    VALUES(new_invitation_id,'found_family',token_digest,code_digest,actor_id,issued_at,issued_at+interval '7 days')
    RETURNING i.id,i.expires_at;
END $$;
--> statement-breakpoint
CREATE FUNCTION public.revoke_founding_invitation(actor_id uuid, invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  PERFORM 1 FROM public.accounts AS a WHERE a.id=actor_id AND a.is_system_admin
    AND a.locked_at IS NULL AND a.family_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM 1 FROM public.family_invitations AS i
    WHERE i.id=invitation_id AND i.kind='found_family' AND i.created_by=actor_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.family_invitations AS i SET revoked_at=clock_timestamp()
    WHERE i.id=invitation_id AND i.accepted_at IS NULL AND i.revoked_at IS NULL
      AND i.expires_at > clock_timestamp();
  RETURN FOUND;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.lookup_founding_invitation(text),
  public.accept_founding_invitation(text,uuid),
  public.issue_founding_invitation(uuid,uuid,text,text),
  public.revoke_founding_invitation(uuid,uuid) FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE app_role text := current_user || '_app';
BEGIN
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.issue_founding_invitation(uuid,uuid,text,text), public.revoke_founding_invitation(uuid,uuid) TO %I', app_role);
END $$;
