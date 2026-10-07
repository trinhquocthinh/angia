import type { Account } from '../../application/ports';
import type { AdminSession } from '../AdminSession';
import { SidebarHeader } from './SidebarHeader';
import { SidebarOverview } from './SidebarOverview';
import { SidebarMembers } from './SidebarMembers';
import { SidebarFooter } from './SidebarFooter';

export function AdminSidebar({ session, accounts }: { session: AdminSession; accounts: Account[] }) {
  const members = session.family ? accounts.filter((account) => account.familyId === session.family?.id) : [];
  return (
    <aside className="fixed inset-y-0 left-0 z-[50] w-60 py-4 px-2 bg-[#eaf6f5] flex flex-col justify-between overflow-y-auto shadow-[0_1px_8px_#0000000a] max-[900px]:static max-[900px]:w-auto max-[900px]:p-3 max-[900px]:gap-3">
      <div className="flex flex-col gap-4 max-[900px]:gap-2">
        <SidebarHeader />
        <SidebarOverview />
        <SidebarMembers members={members} />
      </div>
      <SidebarFooter session={session} />
    </aside>
  );
}
