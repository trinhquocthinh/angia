import { useState } from 'react';
import type { Account, Family } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AccountsTable } from './AccountsTable';
import { AdminIcon } from './AdminIcon';

export function AccountsPanel({
  accounts,
  families,
  pending,
  onTask,
}: {
  accounts: Account[];
  families: Family[];
  pending: boolean;
  onTask: (task: AdminTask) => void;
}) {
  const [search, setSearch] = useState('');
  const visible = accounts.filter((account) =>
    account.displayName.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')),
  );
  return (
    <section
      className="admin-panel min-w-0 bg-white rounded-[16px] shadow-[0_1px_2px_#0000000d] [&_h2]:text-[18px] [&_h2]:leading-[24px] [&_h2]:font-semibold [&_h2]:m-0 overflow-hidden admin-reveal"
      aria-labelledby="accounts-title"
    >
      <div className="admin-panel-heading flex items-center justify-between gap-2 p-5 [&_p]:text-[#707975] [&_p]:text-[13px] [&_p]:leading-[20px] [&_p]:mt-0.5 [&_p]:mx-0 [&_p]:mb-0 max-[600px]:items-stretch max-[600px]:flex-col max-[600px]:gap-3 max-[600px]:p-4">
        <div>
          <div className="admin-heading-with-count flex items-center gap-2 text-[#286958] [&_h2]:text-[#131d1d]">
            <h2 id="accounts-title">Tài khoản người dùng</h2>
            <span className="inline-flex items-center justify-center min-w-6 h-6 py-0 px-2 rounded-full bg-[#deebea] text-[12px] font-semibold text-[#404945]">
              {accounts.length}
            </span>
          </div>
          <p>Phân quyền vai trò và phân bổ nhóm gia đình</p>
        </div>
        <label className="admin-search relative w-64 shrink-0 [&_>_.admin-icon]:absolute [&_>_.admin-icon]:left-3 [&_>_.admin-icon]:top-[50%] [&_>_.admin-icon]:-translate-y-1/2 [&_>_.admin-icon]:text-[#707975] [&_input]:w-full [&_input]:h-10 [&_input]:[padding:0_12px_0_36px] [&_input]:border-0 [&_input]:rounded-[12px] [&_input]:bg-[#eaf6f5] [&_input]:text-[13px] [&_input]:text-[#131d1d] [&_input]:transition-[background-color] [&_input]:duration-[160ms] [&_input]:ease-[ease] [&_input::placeholder]:text-[#707975] [&_input:focus]:bg-[#e4f0f0] max-[600px]:w-full">
          <AdminIcon name="search" size={18} />
          <span className="sr-only">Tìm tài khoản</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm thành viên..."
          />
        </label>
      </div>
      <AccountsTable accounts={visible} families={families} pending={pending} onTask={onTask} />
    </section>
  );
}
