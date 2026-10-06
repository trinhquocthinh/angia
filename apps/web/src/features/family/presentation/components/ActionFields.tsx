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
            className="h-10 w-full min-w-0 rounded-xl border-0 bg-[#eaf6f5] px-3 text-[13px] leading-5 text-[#131d1d] placeholder:text-[#707975] transition-colors focus:bg-[#e4f0f0] disabled:opacity-65"
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
