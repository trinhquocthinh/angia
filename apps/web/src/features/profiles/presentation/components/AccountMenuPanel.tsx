import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { SoonMenuItem } from './SoonMenuItem';
import type { ProfileSession } from '../../application/ports';
import { roleLabel } from './roleLabel';

const item =
  'flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-[#131d1d] transition-colors hover:bg-[#eaf6f5] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#286958]';

// Nội dung menu tài khoản; mục chưa có trang (hồ sơ cá nhân, cài đặt gia đình) để vô hiệu.
export function AccountMenuPanel({
  session,
  pending,
  error,
  onLogout,
}: {
  session: ProfileSession;
  pending: boolean;
  error: boolean;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="flex flex-col border-b border-[#e4f0f0] px-4 pt-2 pb-3">
        <span className="truncate text-sm font-semibold text-[#131d1d]">{session.account.displayName}</span>
        <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#aef0da]/60 px-2.5 py-1 text-xs font-medium text-[#20594b]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#20594b]" />
          {roleLabel(session.role)}
        </span>
      </div>
      <div className="flex flex-col py-1">
        <SoonMenuItem icon="account_circle" label="Hồ sơ cá nhân" className={item} />
        {session.account.isSystemAdmin && (
          <Link to="/admin" className={`${item} justify-between`}>
            <span className="flex items-center gap-3">
              <span className="text-[#20594b]">
                <AdminIcon name="admin_panel_settings" />
              </span>
              Quản trị hệ thống
            </span>
            <span className="rounded-md bg-[#b4eedc] px-2 py-0.5 text-[11px] font-bold tracking-wider text-[#002019] uppercase">
              Admin
            </span>
          </Link>
        )}
        <SoonMenuItem icon="group_add" label="Cài đặt gia đình" className={item} />
      </div>
      <div className="mt-1 border-t border-[#e4f0f0] pt-1">
        <button
          type="button"
          className={`${item} text-[#ba1a1a] hover:bg-[#ffdad6]/20`}
          disabled={pending}
          onClick={onLogout}
        >
          <AdminIcon name="logout" />
          {pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </button>
        {error && (
          <p role="alert" className="px-4 pb-1 text-xs text-[#ba1a1a]">
            Không thể đăng xuất. Vui lòng thử lại.
          </p>
        )}
      </div>
    </>
  );
}
