import { AdminRequestError } from '../../application/AdminRequestError';
import type { PendingAssignmentProps } from '../PendingAssignmentProps';
import { AssignmentFields } from './AssignmentFields';

export function PendingAssignmentForm(props: PendingAssignmentProps) {
  const { account, onSubmit, families, error } = props;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          type: 'assign',
          accountId: account.id,
          familyId: String(form.get('familyId')),
          role: form.get('role') === 'member' ? 'member' : 'main',
        });
      }}
    >
      <div className="admin-pending-account flex items-center gap-2.5 rounded-xl bg-[#eaf6f5]/70 p-3 [&_strong]:block [&_strong]:text-[14px] [&_strong]:leading-[20px] [&_strong]:font-semibold [&_p]:text-xs [&_p]:leading-[18px] [&_p]:text-[#55615f] [&_p]:m-0">
        <span className="w-9 h-9 rounded-full bg-[#aef0da] text-[#055141] inline-flex items-center justify-center text-[14px] font-semibold shrink-0">
          {account.displayName.slice(0, 1).toLocaleUpperCase('vi')}
        </span>
        <div>
          <strong>{account.displayName}</strong>
          <p>Tài khoản chờ phân bổ nhóm gia đình</p>
        </div>
      </div>
      <AssignmentFields {...props} />
      {families.length === 0 && (
        <p className="admin-hint text-[#286958] m-0">Hãy tạo nhóm gia đình trước khi phân bổ.</p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-[12px] py-3 px-4 m-0 text-[13px] leading-[20px] text-[#93000a] bg-[#ffdad6]"
        >
          {error instanceof AdminRequestError ? error.message : 'Không thể kết nối. Vui lòng thử lại.'}
        </p>
      )}
    </form>
  );
}
