import { Link } from '@tanstack/react-router';
import type { ProfileSession } from '../../application/ports';
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
  return (
    <div className="mt-5 space-y-2 lg:mt-auto lg:pt-8">
      <div className="rounded-xl bg-white p-3">
        <p className="break-words text-sm font-semibold">{session.account.displayName}</p>
        <p className="mt-1 break-words text-xs text-[#286958]">
          {session.family?.name} · {session.role === 'main' ? 'Người chăm sóc chính' : 'Thành viên'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 lg:flex-col">
        {session.account.isSystemAdmin && (
          <Link
            to="/admin"
            className="flex min-h-11 items-center rounded-xl px-3 py-2 text-left text-sm font-medium disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] max-md:px-2 max-md:text-xs text-sm"
          >
            Quản trị hệ thống
          </Link>
        )}
        <button
          className="flex min-h-11 items-center rounded-xl px-3 py-2 text-left text-sm font-medium disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] max-md:px-2 max-md:text-xs text-sm text-[#b42318]"
          disabled={pending}
          onClick={onLogout}
        >
          {pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-[#b42318]">
          Không thể đăng xuất. Vui lòng thử lại.
        </p>
      )}
    </div>
  );
}
