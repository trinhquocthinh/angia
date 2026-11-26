import { AdminRequestError } from '../../application/AdminRequestError';
import type { AdminDialogProps } from '../AdminDialogProps';
import { readAdminCommand } from '../readAdminCommand';
import { ActionFields } from './ActionFields';
import { ActionSubmitBar } from './ActionSubmitBar';
import { AdminIcon } from './AdminIcon';

const titles = {
  create: 'Tạo nhóm gia đình',
  assign: 'Gán tài khoản vào nhóm',
  role: 'Đổi vai trò',
  remove: 'Gỡ tài khoản khỏi nhóm',
};
export function ActionForm({
  task,
  families,
  accounts,
  pending,
  error,
  onSubmit,
  onClose,
}: AdminDialogProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(readAdminCommand(task, new FormData(event.currentTarget)));
      }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border/35 pb-4">
        <h2 id="admin-dialog-title" className="auth-heading m-0 text-heading-2 font-semibold text-accent">
          {titles[task.kind]}
        </h2>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border/45 bg-bg text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent disabled:cursor-default"
          aria-label="Đóng hộp thoại"
          disabled={pending}
          onClick={onClose}
        >
          <AdminIcon name="close" size={18} />
        </button>
      </div>
      {task.kind !== 'create' && (
        <p className="m-0 rounded-2xl border border-border/35 bg-bg px-4 py-2.5 text-body font-semibold text-text-primary [overflow-wrap:anywhere]">
          {task.account.displayName}
        </p>
      )}
      <ActionFields task={task} families={families} accounts={accounts} pending={pending} />
      {error && (
        <p className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-body text-danger" role="alert">
          {error instanceof AdminRequestError ? error.message : 'Không thể kết nối. Vui lòng thử lại.'}
        </p>
      )}
      <ActionSubmitBar remove={task.kind === 'remove'} pending={pending} onClose={onClose} />
    </form>
  );
}
