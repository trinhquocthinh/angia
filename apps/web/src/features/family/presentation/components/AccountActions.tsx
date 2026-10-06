import type { Account } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { AdminIcon } from './AdminIcon';

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
    <div className="admin-row-actions flex gap-1 justify-end [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:gap-1 [&_button]:min-h-9 [&_button]:py-1 [&_button]:px-[6px] [&_button]:border-0 [&_button]:rounded-[6px] [&_button]:bg-transparent [&_button]:text-[#286958] [&_button]:text-[11px] [&_button]:leading-[16px] [&_button]:font-semibold [&_button]:whitespace-nowrap [&_button]:cursor-pointer [&_button]:transition-[background-color] [&_button]:duration-[160ms] [&_button]:ease-[ease] [&_button:hover]:bg-[#e4f0f0] [&_.admin-danger-text]:text-[#ba1a1a]">
      {account.familyId ? (
        <>
          <button type="button" disabled={pending} onClick={() => onTask({ kind: 'role', account })}>
            <AdminIcon name="edit" size={16} />
            <span>Đổi vai trò</span>
          </button>
          <button
            type="button"
            className="admin-danger-text"
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
