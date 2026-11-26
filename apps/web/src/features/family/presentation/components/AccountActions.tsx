import type { Account } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AdminIcon } from './AdminIcon';

const BASE =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-caption font-semibold whitespace-nowrap transition-colors';

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
    <div className="flex justify-end gap-1.5">
      {account.familyId ? (
        <>
          <button
            type="button"
            className={`${BASE} border border-border/45 bg-surface text-accent enabled:hover:bg-accent-soft`}
            disabled={pending}
            onClick={() => onTask({ kind: 'role', account })}
          >
            <AdminIcon name="edit" size={16} />
            <span>Đổi vai trò</span>
          </button>
          <button
            type="button"
            className={`${BASE} border-0 bg-danger-soft text-danger enabled:hover:bg-danger-soft/80`}
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
          className={`${BASE} border-0 bg-accent text-on-accent enabled:hover:bg-accent-hover`}
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
