import type { ReactNode } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { HealthProfile } from '../../application/ports';
import { NotificationLink } from '@src/shared/ui/NotificationLink';
import { ProfileSearch } from './ProfileSearch';
import { TopbarNav } from './TopbarNav';
import './profile-topbar.css';

type Props = {
  profiles: HealthProfile[];
  hasFamily: boolean;
  pendingCount?: number | undefined;
  account: ReactNode;
  personal: boolean;
  showNavigation: boolean;
  showSearch: boolean;
};

// Header desktop (≥ lg): khung bo tròn, điều hướng giữa và tìm hồ sơ thu gọn.
export function ProfileTopbar({
  profiles,
  hasFamily,
  pendingCount,
  account,
  personal,
  showNavigation,
  showSearch,
}: Props) {
  return (
    <header className="profile-topbar sticky top-0 z-50 hidden shrink-0 lg:block">
      <div className="profile-topbar-shell">
        <a href="/" className="profile-topbar-brand flex shrink-0 items-center gap-3">
          <img src="/logo.webp" alt="" className="h-10 w-10 object-contain" />
          <span className="flex flex-col">
            <span className="font-['Newsreader',Georgia,serif] text-body font-bold tracking-tight text-accent leading-5">
              AN GIA
            </span>
            <span className="text-body text-text-secondary">Sổ tay chăm sóc gia đình</span>
          </span>
        </a>
        <div className="flex min-w-0 flex-1 items-center justify-center">
          {showNavigation && <TopbarNav pendingCount={pendingCount} personal={personal} />}
        </div>
        <div className="profile-topbar-actions flex shrink-0 items-center gap-1">
          {hasFamily && !personal && showSearch && (
            <details className="profile-topbar-search">
              <summary
                aria-label="Mở tìm hồ sơ thành viên"
                className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-full text-text-secondary hover:bg-accent-soft focus-visible:outline-3 focus-visible:outline-focus"
              >
                <AdminIcon name="search" size={24} />
              </summary>
              <div className="profile-topbar-search-panel">
                <ProfileSearch profiles={profiles} className="w-full" />
              </div>
            </details>
          )}
          {hasFamily && <NotificationLink />}
          {account}
        </div>
      </div>
    </header>
  );
}
