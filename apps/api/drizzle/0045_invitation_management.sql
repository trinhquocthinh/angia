-- Bí mật lời mời mới chỉ ở dạng AES-GCM; legacy NULL, không thể khôi phục hash.
ALTER TABLE public.family_invitations ADD COLUMN secret_ciphertext text;
--> statement-breakpoint
CREATE INDEX family_invitations_management_idx ON public.family_invitations(family_id,created_at DESC,id DESC);
--> statement-breakpoint
DO $$ BEGIN
 EXECUTE format('GRANT SELECT(secret_ciphertext) ON public.family_invitations TO %I',current_user || '_app');
END $$;
