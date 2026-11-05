import type { Account, Family } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AccountsTable } from './AccountsTable';
import { AdminCardHeading } from './AdminCardHeading';
import { AdminIcon } from './AdminIcon';

export function AccountsPanel({
  accounts,
  families,
  pending,
  onTask,
  search,
  onSearch,
}: {
  accounts: Account[];
  families: Family[];
  pending: boolean;
  onTask: (task: AdminTask) => void;
  search: string;
  onSearch: (search: string) => void;
}) {
  const visible = accounts.filter((account) =>
    account.displayName.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')),
  );
  return (
    <section
      className="admin-panel min-w-0 bg-white rounded-[16px] shadow-[0_1px_2px_#0000000d] [&_h2]:text-[18px] [&_h2]:leading-[24px] [&_h2]:font-semibold [&_h2]:m-0 overflow-hidden admin-reveal"
      aria-labelledby="accounts-title"
    >
      <div className="flex items-center justify-between gap-3 p-5 pb-3 max-[600px]:items-stretch max-[600px]:flex-col max-[600px]:p-4 max-[600px]:pb-2">
        <AdminCardHeading
          id="accounts-title"
          icon={<AdminIcon name="manage_accounts" />}
          title="Tài khoản người dùng"
          aside={
            <span className="shrink-0 rounded-full bg-[#aef0da]/60 px-2.5 py-1 text-xs font-semibold text-[#004135]">
              {accounts.length} tài khoản
            </span>
          }
        />
        <label className="admin-search relative w-56 shrink-0 [&_>_.admin-icon]:absolute [&_>_.admin-icon]:left-3 [&_>_.admin-icon]:top-[50%] [&_>_.admin-icon]:-translate-y-1/2 [&_>_.admin-icon]:text-[#707975] [&_input]:w-full [&_input]:h-10 [&_input]:[padding:0_12px_0_36px] [&_input]:border-0 [&_input]:rounded-[12px] [&_input]:bg-[#eaf6f5] [&_input]:text-[13px] [&_input]:text-[#131d1d] [&_input]:transition-[background-color] [&_input]:duration-[160ms] [&_input]:ease-[ease] [&_input::placeholder]:text-[#707975] [&_input:focus]:bg-[#e4f0f0] max-[600px]:w-full">
          <AdminIcon name="search" size={18} />
          <span className="sr-only">Tìm tài khoản</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Tìm theo tên..."
          />
        </label>
      </div>
      <AccountsTable accounts={visible} families={families} pending={pending} onTask={onTask} />
    </section>
  );
}
