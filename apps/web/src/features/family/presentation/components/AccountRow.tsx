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
        <div className="flex min-w-[120px] items-center gap-3">
          <span
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${account.isSystemAdmin ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent'}`}
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
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-caption font-semibold whitespace-nowrap ${account.role === 'main' ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent'}`}
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
