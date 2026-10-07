import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logoutSession } from '@src/features/auth/infrastructure/logoutSession';
import { AdminIcon } from './AdminIcon';

export function LogoutButton({ csrfToken }: { csrfToken: string }) {
  const client = useQueryClient();
  const logout = useMutation({
    mutationFn: () => logoutSession(csrfToken),
    retry: false,
    onSuccess: () => {
      client.clear();
      window.location.assign('/login');
    },
  });
  return (
    <>
      <button
        type="button"
        className="admin-nav-link flex items-center gap-2 min-h-10 p-2 border-0 rounded-[12px] bg-transparent text-[#404945] no-underline text-[14px] font-medium text-left transition-[background-color,color] duration-[160ms] ease-[ease] cursor-pointer [&:hover]:bg-[#e4f0f0] [&:hover]:text-[#131d1d] [&:disabled]:opacity-65 [&:disabled]:cursor-default max-[900px]:shrink-0 admin-logout"
        aria-label="Đăng xuất"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        <AdminIcon name="logout" size={18} />
        <span>{logout.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
      </button>
      {logout.isError && (
        <p className="text-[11px] text-[#ba1a1a] m-0 py-1 px-2" role="alert">
          Không thể đăng xuất. Vui lòng thử lại.
        </p>
      )}
    </>
  );
}
