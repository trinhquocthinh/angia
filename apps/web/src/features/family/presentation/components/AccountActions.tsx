import type { Account } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AdminIcon } from './AdminIcon';

const BASE =
  'inline-flex min-h-9 cursor-pointer items-center justify-center gap-1 rounded-lg border-0 px-2 py-1 text-xs leading-4 font-semibold whitespace-nowrap transition-colors';

export function AccountActions({
  account,
  pending,
  hasFamilies,
  onTask,
}: {
  account: Account;
  pending: boolean;
  hasFamilies: boolean;
  onTask: (task: AdminTask) => void;
}) {
  return (
    <div className="admin-row-actions flex justify-end gap-1">
      {account.familyId ? (
        <>
          <button
            type="button"
            className={`${BASE} bg-white text-[#286958] enabled:hover:bg-[#deebea]`}
            disabled={pending}
            onClick={() => onTask({ kind: 'role', account })}
          >
            <AdminIcon name="edit" size={16} />
            <span>Đổi vai trò</span>
          </button>
          <button
            type="button"
            className={`${BASE} bg-transparent text-[#ba1a1a] enabled:hover:bg-[#ffdad6]/60`}
            disabled={pending}
            onClick={() => onTask({ kind: 'remove', account })}
          >
            <AdminIcon name="person_remove" size={16} />
            <span>Gỡ khỏi nhóm</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          className={`${BASE} bg-[#004135] text-white enabled:hover:bg-[#20594b]`}
          disabled={pending || !hasFamilies}
          onClick={() => onTask({ kind: 'assign', account })}
        >
          <AdminIcon name="person_add" size={16} />
          <span>Gán nhóm</span>
        </button>
      )}
    </div>
  );
}
