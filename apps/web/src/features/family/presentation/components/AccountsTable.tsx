import type { Account, Family } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AccountRow } from './AccountRow';

export function AccountsTable({
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
  return (
    <div
      className="overflow-x-auto px-5 pb-5 sm:px-6 sm:pb-6"
      role="region"
      aria-label="Danh sách tài khoản"
      tabIndex={0}
    >
      <table className="w-full border-separate border-spacing-y-2 text-caption [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-caption [&_th]:font-semibold [&_th]:whitespace-nowrap [&_th]:text-text-secondary [&_th:last-child]:text-right [&_td]:bg-bg [&_td]:px-2.5 [&_td]:py-3 [&_td]:align-middle [&_td]:transition-colors [&_td]:duration-150 [&_td:first-child]:rounded-l-2xl [&_td:last-child]:rounded-r-2xl [&_tbody_tr:hover_td]:bg-accent-soft/70 [&_strong]:block [&_strong]:text-body [&_strong]:font-semibold [&_small]:block [&_small]:text-caption [&_small]:text-text-secondary max-[600px]:min-w-170">
        <caption className="sr-only">Danh sách tài khoản và vai trò trong nhóm</caption>
        <thead>
          <tr>
            <th scope="col">Họ và tên</th>
            <th scope="col">Nhóm gia đình</th>
            <th scope="col">Vai trò</th>
            <th scope="col">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              families={families}
              pending={pending}
              onTask={onTask}
            />
          ))}
        </tbody>
      </table>
      {accounts.length === 0 && (
        <p className="py-3 m-0 text-text-secondary text-caption ">Không có tài khoản phù hợp.</p>
      )}
    </div>
  );
}
