-- E29-S1-T1: đăng nhập lần đầu sau khi bị đặt lại mật khẩu cần biết ai đã đặt lại (SPEC-062).
-- Chỉ cấp đọc các cột cần thiết; bảng vẫn append-only (không UPDATE/DELETE/TRUNCATE).
DO $$ BEGIN
 EXECUTE format('GRANT SELECT(action,actor_account_id,target_account_id,occurred_at) ON public.admin_audit_events TO %I',current_user || '_app');
END $$;
