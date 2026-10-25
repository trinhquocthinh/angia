import type { Account, Family } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AccountActions } from './AccountActions';
import { AdminIcon } from './AdminIcon';

export function AccountRow({
  account,
  families,
  pending,
  onTask,
}: {
  account: Account;
  families: Family[];
  pending: boolean;
  onTask: (task: AdminTask) => void;
}) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-[10px] min-w-[130px]">
          <span
            className={`w-8 h-8 rounded-full bg-[#aef0da] text-[#055141] inline-flex items-center justify-center text-[12px] font-semibold shrink-0 ${account.isSystemAdmin ? 'bg-[#20594b]! text-[#95cebc]!' : ''}`}
          >
            {account.displayName.slice(0, 1).toLocaleUpperCase('vi')}
          </span>
          <div>
            <strong>{account.displayName}</strong>
            {account.isSystemAdmin && <small>Quản trị hệ thống</small>}
          </div>
        </div>
      </td>
      <td>
        {account.familyId ? (
          <span className="inline-flex py-0.5 px-2 rounded-[6px] bg-[#e4f0f0] text-[11px] leading-[14px] text-[#131d1d] whitespace-nowrap">
            {families.find((family) => family.id === account.familyId)?.name ?? 'Nhóm chưa tải được'}
          </span>
        ) : (
          <span className="text-[#753400] bg-[#ffdbc9] py-0.5 px-2 rounded-[6px] text-[11px] whitespace-nowrap">
            Chờ gán nhóm
          </span>
        )}
      </td>
      <td>
        {account.role ? (
          <span
            className={`inline-flex items-center gap-1 py-0.5 px-[10px] rounded-full bg-[#e4f0f0] text-[#404945] text-[11px] leading-[14px] font-semibold whitespace-nowrap ${account.role === 'main' ? 'bg-[#aef0da]! text-[#2f6f5e]!' : ''}`}
          >
            <AdminIcon name={account.role === 'main' ? 'verified_user' : 'person'} size={13} />
            {account.role === 'main' ? 'Quản trị chính' : 'Thành viên'}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td>
        <AccountActions
          account={account}
          pending={pending}
          hasFamilies={families.length > 0}
          onTask={onTask}
        />
      </td>
    </tr>
  );
}
