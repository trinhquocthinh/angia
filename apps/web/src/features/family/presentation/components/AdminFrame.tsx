import type { ReactNode } from 'react';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import '@src/features/profiles/presentation/profiles.css';
import type { AdminSession } from '../AdminSession';

export type AdminFrameShell = {
  profiles: HealthProfile[];
  logout: { isPending: boolean; isError: boolean; mutate: () => void };
};

// Dùng chung header và chân trang với các màn khác (Stitch 01314cab): quản trị không còn sidebar riêng.
export function AdminFrame({
  session,
  shell,
  children,
}: {
  session: AdminSession;
  shell: AdminFrameShell;
  children: ReactNode;
}) {
  return (
    <ProfileFrame
      session={session}
      profiles={shell.profiles}
      logout={shell.logout}
      mobileTitle="Quản trị hệ thống"
    >
      <div className="admin-screen admin-content flex flex-col gap-6 text-[15px] leading-[24px] antialiased [&_*]:box-border [&_button:disabled]:cursor-default [&_button:disabled]:opacity-65 [&_button:disabled]:transform-none [&_button:disabled]:shadow-none [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-[#286958] [&_:focus-visible]:outline-offset-3 motion-reduce:[&_*]:transition-none">
        {children}
      </div>
    </ProfileFrame>
  );
}
