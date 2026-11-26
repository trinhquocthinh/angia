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
    <section className="profile-bento-card min-w-0 overflow-hidden" aria-labelledby="accounts-title">
      <div className="flex flex-col items-stretch justify-between gap-3 p-5 pb-3 sm:flex-row sm:items-center sm:p-6 sm:pb-3">
        <AdminCardHeading
          id="accounts-title"
          icon={<AdminIcon name="manage_accounts" />}
          title="Tài khoản người dùng"
          aside={
            <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-caption font-semibold text-on-secondary-container tabular-nums">
              {accounts.length} tài khoản
            </span>
          }
        />
        <label className="relative w-full shrink-0 sm:w-56 [&>.admin-icon]:pointer-events-none [&>.admin-icon]:absolute [&>.admin-icon]:top-1/2 [&>.admin-icon]:left-3.5 [&>.admin-icon]:-translate-y-1/2 [&>.admin-icon]:text-text-secondary">
          <AdminIcon name="search" size={18} />
          <span className="sr-only">Tìm tài khoản</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Tìm theo tên..."
            className="min-h-11 w-full rounded-2xl border border-border/45 bg-bg pr-3.5 pl-10 text-body text-text-primary transition-colors placeholder:text-text-secondary focus:bg-surface"
          />
        </label>
      </div>
      <AccountsTable accounts={visible} families={families} pending={pending} onTask={onTask} />
    </section>
  );
}
