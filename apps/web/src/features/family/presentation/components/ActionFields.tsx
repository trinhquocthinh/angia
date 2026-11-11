import type { Account, Family } from '../../application/ports';
import type { AdminTask } from '../AdminTask';
import { MembershipFields } from './MembershipFields';

export function ActionFields({
  task,
  families,
  accounts,
  pending,
}: {
  task: AdminTask;
  families: Family[];
  accounts: Account[];
  pending: boolean;
}) {
  return (
    <fieldset disabled={pending}>
      {task.kind === 'create' && (
        <label>
          Tên nhóm
          <input
            className="h-10 w-full min-w-0 rounded-xl border-0 bg-accent-soft px-3 text-[13px] leading-5 text-text-primary placeholder:text-text-secondary transition-colors focus:bg-accent-soft disabled:opacity-65"
            name="name"
            required
            maxLength={60}
            placeholder="Ví dụ: Nhà An"
          />
        </label>
      )}
      {(task.kind === 'assign' || task.kind === 'role') && (
        <MembershipFields
          families={families}
          accounts={accounts}
          account={task.account}
          assign={task.kind === 'assign'}
        />
      )}
      {task.kind === 'remove' && (
        <p>
          Tài khoản sẽ trở về trạng thái chờ gán nhóm. Liên kết tới hồ sơ sức khỏe trong nhóm cũ sẽ được gỡ.
          Bạn xác nhận tiếp tục?
        </p>
      )}
    </fieldset>
  );
}
