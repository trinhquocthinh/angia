import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { NotificationLink } from '@src/shared/ui/NotificationLink';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Header di động (< lg): có `title` thì hiện nút quay lại + tên trang, không thì hiện thương hiệu.
type Props = {
  title?: string | undefined;
  hasFamily: boolean;
  account: ReactNode;
};
export function MobileTopbar({ title, hasFamily, account }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-bg/85 pt-[env(safe-area-inset-top)] shadow-[0_1px_8px_color-mix(in_srgb,var(--color-shadow)_3%,transparent)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {title && (
            <Link
              to="/"
              aria-label="Về AN GIA"
              className="-ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-focus"
            >
              <AdminIcon name="arrow_back" size={24} />
            </Link>
          )}
          {!title && (
            <a
              href="/"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center"
              aria-label="AN GIA"
            >
              <img src="/logo.webp" alt="" className="h-9 w-9 rounded-lg object-contain" />
            </a>
          )}
          {title ? (
            <p className="truncate font-['Newsreader',Georgia,serif] text-button-primary font-semibold tracking-tight text-accent">
              {title}
            </p>
          ) : (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-body font-semibold tracking-tight text-accent">AN GIA</span>
              <span className="truncate text-caption font-medium tracking-[0.03em] text-text-secondary">
                Sổ tay chăm sóc gia đình • Trang Chủ
              </span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {hasFamily && !title && <NotificationLink />}
          {account}
        </div>
      </div>
    </header>
  );
}
