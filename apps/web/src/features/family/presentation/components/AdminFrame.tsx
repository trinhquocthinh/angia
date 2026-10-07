import type { ReactNode } from 'react';
import type { Account } from '../../application/ports';
import type { AdminSession } from '../AdminSession';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminFrame({
  session,
  accounts,
  children,
}: {
  session: AdminSession;
  accounts: Account[];
  children: ReactNode;
}) {
  return (
    <div className="admin-screen min-h-dvh bg-[#f0fcfb] text-[#131d1d] font-sans text-[15px] leading-[24px] antialiased [&_*]:box-border [&_h1]:m-0 [&_h1]:text-[#004135] [&_h1]:text-[32px] [&_h1]:leading-[38px] [&_h1]:font-semibold [&_h1]:tracking-[-0.025em] [&_button:disabled]:cursor-default [&_button:disabled]:opacity-65 [&_button:disabled]:transform-none [&_button:disabled]:shadow-none [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-[#286958] [&_:focus-visible]:outline-offset-3 max-[600px]:[&_h1]:text-[24px] max-[600px]:[&_h1]:leading-[30px] motion-reduce:[&_*]:transition-none">
      <AdminSidebar session={session} accounts={accounts} />
      <div className="ml-60 pt-16 max-[900px]:ml-0 max-[900px]:pt-0">
        <AdminTopbar />
        <div className="admin-content max-w-360 m-auto py-6 px-12 flex flex-col gap-6 max-[1199px]:p-6 max-[600px]:pt-5 max-[600px]:px-4 max-[600px]:pb-10 max-[600px]:gap-5">
          {children}
        </div>
      </div>
    </div>
  );
}
