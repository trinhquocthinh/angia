import { Link } from '@tanstack/react-router';
import type { ProfileSession } from '../../application/ports';
import { ProfileIcon } from './ProfileIcon';

const action =
  'flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]';

// Thẻ tài khoản cuối sidebar: định danh + thao tác tài khoản gom trong một khối (cùng kiểu với trang quản trị).
export function ProfileAccountFooter({
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
  const role = session.role === 'main' ? 'Người chăm sóc chính' : 'Thành viên';
  return (
    <div className="mt-5 lg:mt-auto lg:pt-6">
      <div className="rounded-2xl bg-white p-1.5 shadow-[0_1px_2px_#1f2a2a0f]">
        <div className="flex items-center gap-2.5 p-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#20594b] text-sm font-semibold text-[#95cebc]"
          >
            {session.account.displayName.slice(0, 1).toLocaleUpperCase('vi')}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{session.account.displayName}</p>
            <p className="truncate text-xs text-[#286958]">
              {session.family ? `${session.family.name} · ${role}` : role}
            </p>
          </div>
        </div>
        <div className="mx-2 my-1 h-px bg-[#e4f0ef]" />
        {session.account.isSystemAdmin && (
          <Link to="/admin" className={`${action} text-[#404945] hover:bg-[#e4f0f0] hover:text-[#004135]`}>
            <ProfileIcon name="shield" size={18} /> Quản trị hệ thống
          </Link>
        )}
        <button
          type="button"
          className={`${action} text-[#b42318] hover:bg-[#ffdad6] hover:text-[#93000a]`}
          disabled={pending}
          onClick={onLogout}
        >
          <ProfileIcon name="logout" size={18} /> {pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 px-1 text-sm text-[#b42318]">
          Không thể đăng xuất. Vui lòng thử lại.
        </p>
      )}
    </div>
  );
}
