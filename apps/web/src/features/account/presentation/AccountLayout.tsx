import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import './account.css';
type Props = { children: ReactNode; footer: ReactNode; back?: boolean; admin?: boolean };
export function AccountLayout({ children, footer, back = false, admin = false }: Props) {
  return (
    <div className="account-screen min-h-dvh bg-bg px-4 py-8 font-sans text-lg text-text-primary sm:py-12">
      <div className="mx-auto w-full max-w-[480px]">
        {back && (
          <Link to="/login" className="account-link mb-4 inline-flex min-h-12 items-center">
            ← Quay lại
          </Link>
        )}
        <header className="mb-8 text-center">
          <h1 className="text-[28px] leading-9 font-semibold">AN GIA</h1>
          <p className="mt-2 text-lg leading-7 text-text-secondary">Sổ sức khỏe của cả nhà</p>
        </header>
        <section className="account-card rounded-[20px] border border-border bg-surface p-6 shadow-card sm:p-8">
          {children}
        </section>
        <div className="mt-6 flex flex-col items-center gap-4 text-center text-lg leading-7">{footer}</div>
        {admin && (
          <div className="mt-12 text-center">
            <a
              href="/api/auth/login"
              className="account-link account-admin inline-flex min-h-12 items-center text-base"
            >
              Đăng nhập quản trị
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
