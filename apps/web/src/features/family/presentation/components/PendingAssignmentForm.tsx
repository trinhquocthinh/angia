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
      <div className="flex items-center gap-3 rounded-2xl border border-border/35 bg-bg p-3.5 [&_p]:m-0 [&_p]:text-caption [&_p]:text-text-secondary [&_strong]:block [&_strong]:text-body [&_strong]:font-semibold">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-caption font-semibold text-accent">
          {account.displayName.slice(0, 1).toLocaleUpperCase('vi')}
        </span>
        <div>
          <strong>{account.displayName}</strong>
          <p>Tài khoản chờ phân bổ nhóm gia đình</p>
        </div>
      </div>
      <AssignmentFields {...props} />
      {families.length === 0 && (
        <p className="m-0 text-caption text-accent">Hãy tạo nhóm gia đình trước khi phân bổ.</p>
      )}
      {error && (
        <p role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-body text-danger">
          {error instanceof AdminRequestError ? error.message : 'Không thể kết nối. Vui lòng thử lại.'}
        </p>
      )}
    </form>
  );
}
