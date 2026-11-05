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
    <div className="overflow-x-auto px-4 pb-4">
      <table className="admin-table w-full border-separate border-spacing-y-1.5 text-[13px] leading-[20px] [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-[#404945] [&_th]:text-left [&_th]:text-xs [&_th]:leading-4 [&_th]:font-semibold [&_th]:whitespace-nowrap [&_th:last-child]:text-right [&_td]:py-2.5 [&_td]:px-2 [&_td]:align-middle [&_td]:bg-[#eaf6f5]/70 [&_td]:transition-colors [&_td]:duration-150 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr:hover_td]:bg-[#e4f0f0] [&_strong]:block [&_strong]:text-[14px] [&_strong]:leading-[20px] [&_strong]:font-semibold [&_small]:block [&_small]:text-[11px] [&_small]:leading-[14px] [&_small]:text-[#55615f] max-[600px]:min-w-170">
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
        <p className="py-3 m-0 text-[#55615f] text-[13px] leading-[20px]">Không có tài khoản phù hợp.</p>
      )}
    </div>
  );
}
