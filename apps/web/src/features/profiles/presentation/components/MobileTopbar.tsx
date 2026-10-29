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
    <header className="sticky top-0 z-40 bg-[#f0fcfb]/85 pt-[env(safe-area-inset-top)] shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {title && (
            <Link
              to="/"
              aria-label="Về AN GIA"
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#404945] hover:text-[#131d1d] focus-visible:outline-2 focus-visible:outline-[#286958]"
            >
              <AdminIcon name="arrow_back" size={24} />
            </Link>
          )}
          <a href="/" className="shrink-0" aria-label="AN GIA">
            <img src="/logo.webp" alt="" className="h-9 w-9 rounded-lg object-contain" />
          </a>
          {title ? (
            <p className="truncate font-['Newsreader',Georgia,serif] text-xl font-semibold tracking-tight text-[#004135]">
              {title}
            </p>
          ) : (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg leading-6 font-semibold tracking-tight text-[#004135]">
                AN GIA
              </span>
              <span className="truncate text-[11px] leading-[14px] font-medium tracking-[0.03em] text-[#404945]">
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
              className="flex h-11 w-11 items-center justify-center text-[#404945] transition-colors hover:text-[#004135] focus-visible:outline-2 focus-visible:outline-[#286958]"
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
