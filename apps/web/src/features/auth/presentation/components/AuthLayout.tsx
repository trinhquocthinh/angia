import type { ReactNode } from 'react';
import { AuthBrand } from './AuthBrand';
import '../auth.css';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="auth-screen flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8">
      <div className="w-full max-w-[480px] rounded-xl bg-surface px-6 py-8 shadow-[0_20px_25px_-5px_rgb(0_0_0/0.1),0_8px_10px_-6px_rgb(0_0_0/0.1)] sm:p-10">
        <AuthBrand />
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
