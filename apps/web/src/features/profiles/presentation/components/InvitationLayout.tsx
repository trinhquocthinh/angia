import type { ReactNode } from 'react';
import '@src/features/auth/presentation/auth.css';
import { InvitationIcon } from './InvitationIcon';
export function InvitationLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#f0fcfb] px-4 py-4 text-[#131d1d] sm:py-10">
      <div className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-xl bg-white p-6 shadow-[0_2px_8px_rgb(0_65_53/0.1)] sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#aef0da]/30 blur-2xl"
        />
        <header className="relative flex flex-col items-center text-center">
          <div className="mb-3 rounded-xl bg-[#eaf6f5] p-2">
            <img src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
          </div>
          <p className="auth-heading text-xl font-semibold tracking-wider text-[#004135]">AN GIA</p>
          <p className="auth-heading mt-1 text-xs italic leading-5 text-[#286958]">
            “Chăm chút từng thói quen, chở che từng thế hệ.”
          </p>
        </header>
        <div className="relative mt-6">{children}</div>
        <footer className="relative mt-6 flex items-center justify-center gap-2 text-[11px] leading-4 text-[#55615f]">
          <InvitationIcon name="shield" />
          <span>Bạn chủ động quyết định việc chia sẻ dữ liệu.</span>
        </footer>
      </div>
    </main>
  );
}
