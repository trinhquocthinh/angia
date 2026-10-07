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
    <div className="overflow-x-auto">
      <table className="admin-table w-full border-collapse text-[13px] leading-[20px] [&_th]:p-3 [&_th]:bg-[#eaf6f5] [&_th]:text-[#404945] [&_th]:text-left [&_th]:text-[12px] [&_th]:leading-[16px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.02em] [&_th]:whitespace-nowrap [&_th:first-child]:pl-4 [&_td:first-child]:pl-4 [&_th:last-child]:text-right [&_th:last-child]:pr-4 [&_td]:py-[10px] [&_td]:px-3 [&_td]:border-b [&_td]:border-[#e4f0f0] [&_td]:align-middle [&_tbody_tr]:h-13 [&_tbody_tr]:transition-[background-color] [&_tbody_tr]:duration-150 [&_tbody_tr]:ease-[ease] [&_tbody_tr:hover]:bg-[#e3efea99] [&_tbody_tr:last-child_td]:border-b-0 [&_strong]:block [&_strong]:text-[14px] [&_strong]:leading-[20px] [&_strong]:font-semibold [&_small]:block [&_small]:text-[10px] [&_small]:leading-[14px] [&_small]:text-[#707975] max-[600px]:min-w-170">
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
        <p className="py-4 px-5 m-0 text-[#707975] text-[13px] leading-[20px]">Không có tài khoản phù hợp.</p>
      )}
    </div>
  );
}
