import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { HealthProfile } from '../../application/ports';
import { ProfileSearch } from './ProfileSearch';
import { TopbarNav } from './TopbarNav';

// Header desktop (≥ lg): thương hiệu, tìm hồ sơ + điều hướng chính, thông báo và menu tài khoản.
export function ProfileTopbar({
  profiles,
  hasFamily,
  pendingCount,
  account,
}: {
  profiles: HealthProfile[];
  hasFamily: boolean;
  pendingCount?: number | undefined;
  account: ReactNode;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 hidden bg-[#f0fcfb]/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-8">
        <a href="/" className="flex shrink-0 items-center gap-3">
          <img src="/logo.webp" alt="" className="h-9 w-9 object-contain" />
          <span className="flex flex-col">
            <span className="font-['Newsreader',Georgia,serif] text-lg leading-tight font-bold tracking-tight text-[#004135]">
              AN GIA
            </span>
            <span className="text-[11px] leading-none text-[#404945]">Sổ Sức Khỏe Gia Đình</span>
          </span>
        </a>
        <div className="flex max-w-2xl flex-1 items-center justify-center gap-3 px-2">
          <ProfileSearch profiles={profiles} className="w-80 shrink-0" />
          <TopbarNav pendingCount={pendingCount} />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {hasFamily && (
            <Link
              to="/notifications"
              aria-label="Cài đặt thông báo"
              title="Cài đặt thông báo"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[#404945] transition-colors hover:bg-[#e4f0f0] hover:text-[#131d1d] focus-visible:outline-2 focus-visible:outline-[#286958]"
            >
              <AdminIcon name="notifications" />
            </Link>
          )}
          {account}
        </div>
      </div>
    </header>
  );
}
