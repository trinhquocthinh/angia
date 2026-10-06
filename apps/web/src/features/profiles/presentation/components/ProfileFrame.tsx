import { ProfileIcon } from './ProfileIcon';
import type { ReactNode } from 'react';
import type { HealthProfile, ProfileSession } from '../../application/ports';
import { ProfileSidebar } from './ProfileSidebar';
export function ProfileFrame({
  session,
  profiles,
  logout,
  children,
}: {
  session: ProfileSession;
  profiles: HealthProfile[];
  logout: { isPending: boolean; isError: boolean; mutate: () => void };
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f0fcfb] text-[#131d1d]">
      <ProfileSidebar
        session={session}
        profiles={profiles}
        pending={logout.isPending}
        error={logout.isError}
        onLogout={() => logout.mutate()}
      />
      <div className="min-w-0 lg:ml-[240px]">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#e4f0ef] px-4 py-3 lg:px-8">
          <a href="/" className="flex items-center gap-3 text-sm font-semibold text-[#004135]">
            <img src="/logo.png" className="h-8 w-8 object-contain" alt="" />
            Hồ Sơ Sức Khỏe Gia Đình
          </a>
          <div className="flex gap-3">
            <button
              disabled
              className="hidden rounded-full bg-[#e4f0ef] px-4 py-2 text-sm text-[#55615f] sm:block"
            >
              Tìm kiếm hồ sơ, đơn thuốc…
            </button>
            <button
              disabled
              aria-label="Thông báo (chưa triển khai)"
              className="flex min-h-11 min-w-11 items-center justify-center text-[#55615f]"
            >
              <ProfileIcon name="bell" />
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
