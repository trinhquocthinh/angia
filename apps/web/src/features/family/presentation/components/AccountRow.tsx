import type { Account, Family } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AccountActions } from './AccountActions';
import { AccountFamilyBadge } from './AccountFamilyBadge';
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
        <div className="flex items-center gap-[10px] min-w-[110px]">
          <span
            className={`w-8 h-8 rounded-full bg-accent-soft text-accent inline-flex items-center justify-center text-[12px] font-semibold shrink-0 ${account.isSystemAdmin ? 'bg-accent! text-on-accent!' : ''}`}
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
        <AccountFamilyBadge
          name={
            account.familyId
              ? (families.find((family) => family.id === account.familyId)?.name ?? 'Nhóm chưa tải được')
              : null
          }
        />
      </td>
      <td>
        {account.role ? (
          <span
            className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-surface text-text-secondary text-xs leading-4 font-semibold whitespace-nowrap ${account.role === 'main' ? 'bg-accent-soft! text-accent!' : ''}`}
          >
            <AdminIcon name={account.role === 'main' ? 'verified_user' : 'person'} size={13} />
            {account.role === 'main' ? 'Quản trị chính' : 'Thành viên'}
          </span>
        ) : (
          <span className="text-text-secondary">—</span>
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
