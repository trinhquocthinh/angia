import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Header di động (< lg): có `title` thì hiện nút quay lại + tên trang, không thì hiện thương hiệu.
export function MobileTopbar({
  title,
  hasFamily,
  account,
}: {
  title?: string | undefined;
  hasFamily: boolean;
  account: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 bg-surface-raised/85 pt-[env(safe-area-inset-top)] shadow-[0_1px_8px_color-mix(in_srgb,var(--color-shadow)_3%,transparent)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {title && (
            <Link
              to="/"
              aria-label="Về AN GIA"
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-focus"
            >
              <AdminIcon name="arrow_back" size={24} />
            </Link>
          )}
          <a href="/" className="shrink-0" aria-label="AN GIA">
            <img src="/logo.webp" alt="" className="h-9 w-9 rounded-lg object-contain" />
          </a>
          {title ? (
            <p className="truncate font-['Newsreader',Georgia,serif] text-xl font-semibold tracking-tight text-accent">
              {title}
            </p>
          ) : (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg leading-6 font-semibold tracking-tight text-accent">
                AN GIA
              </span>
              <span className="truncate text-[11px] leading-[14px] font-medium tracking-[0.03em] text-text-secondary">
                Sổ Sức Khỏe Gia Đình • Trang Chủ
              </span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {hasFamily && !title && (
            <Link
              to="/notifications"
              aria-label="Cài đặt thông báo"
              className="flex h-11 w-11 items-center justify-center text-text-secondary transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-focus"
            >
              <AdminIcon name="notifications" size={24} />
            </Link>
          )}
          {account}
        </div>
      </div>
    </header>
  );
}
