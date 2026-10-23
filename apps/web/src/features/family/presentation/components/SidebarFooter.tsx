import { Link } from '@tanstack/react-router';
import type { AdminSession } from '../AdminSession';
import { AdminIcon } from './AdminIcon';
import { LogoutButton } from './LogoutButton';

// Thẻ tài khoản cuối sidebar: định danh + thao tác gom một khối, cùng kiểu với sidebar người dùng.
export function SidebarFooter({ session }: { session: AdminSession }) {
  const subtitle = session.family
    ? `${session.family.name} · ${session.role === 'main' ? 'Chủ hộ' : 'Thành viên'}`
    : 'Quản trị hệ thống';
  return (
    <div className="admin-sidebar-footer flex flex-col gap-0.5 mt-4 p-1.5 bg-white rounded-[16px] shadow-[0_1px_2px_#1f2a2a0f] [&_.admin-nav-link]:text-[13px] [&_.admin-settings]:bg-[#e4f0f0] [&_.admin-settings]:text-[#004135] [&_.admin-settings]:font-semibold [&_.admin-logout]:text-[#ba1a1a] [&_.admin-logout:hover]:bg-[#ffdad6] [&_.admin-logout:hover]:text-[#93000a] max-[900px]:mt-0 max-[900px]:flex-row max-[900px]:items-center max-[900px]:[&_.admin-nav-link]:w-10 max-[900px]:[&_.admin-nav-link]:justify-center max-[900px]:[&_.admin-nav-link_>_span:not(.admin-icon)]:hidden">
      <div className="admin-identity flex items-center gap-2.5 p-2 [&_>_div]:min-w-0 [&_strong]:block [&_strong]:text-[14px] [&_strong]:leading-[18px] [&_strong]:font-semibold [&_strong]:text-[#131d1d] [&_strong]:truncate [&_div_>_span]:block [&_div_>_span]:text-[11px] [&_div_>_span]:leading-[16px] [&_div_>_span]:text-[#286958] [&_div_>_span]:truncate max-[900px]:flex-1 max-[900px]:min-w-0">
        <span className="w-9 h-9 rounded-full bg-[#20594b] text-[#95cebc] inline-flex items-center justify-center text-[14px] font-semibold shrink-0">
          {session.account.displayName.slice(0, 1).toLocaleUpperCase('vi')}
        </span>
        <div>
          <strong>{session.account.displayName}</strong>
          <span>{subtitle}</span>
        </div>
      </div>
      <div className="mx-2 my-1 h-px bg-[#e4f0ef] max-[900px]:hidden" />
      <Link
        to="/admin"
        className="admin-nav-link flex items-center gap-2.5 min-h-10 p-2 border-0 rounded-[12px] bg-transparent text-[#404945] no-underline text-[14px] font-medium text-left transition-[background-color,color] duration-[160ms] ease-[ease] cursor-pointer [&:hover]:bg-[#e4f0f0] [&:hover]:text-[#131d1d] max-[900px]:shrink-0 admin-settings"
        aria-current="page"
        aria-label="Quản trị hệ thống"
      >
        <AdminIcon name="settings" size={18} />
        <span>Quản trị hệ thống</span>
      </Link>
      <LogoutButton csrfToken={session.csrfToken} />
    </div>
  );
}
