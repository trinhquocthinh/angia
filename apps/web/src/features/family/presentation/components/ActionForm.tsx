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
      <div className="flex items-center justify-between gap-4">
        <h2 id="admin-dialog-title">{titles[task.kind]}</h2>
        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-[#404945] transition-colors hover:bg-[#eaf6f5] hover:text-[#004135] disabled:cursor-default"
          aria-label="Đóng hộp thoại"
          disabled={pending}
          onClick={onClose}
        >
          <AdminIcon name="close" size={16} />
        </button>
      </div>
      {task.kind !== 'create' && (
        <p className="mt--2 mx-0 mb-0 text-[#55615f] [overflow-wrap:anywhere]">{task.account.displayName}</p>
      )}
      <ActionFields task={task} families={families} accounts={accounts} pending={pending} />
      {error && (
        <p
          className="rounded-[12px] py-3 px-4 m-0 text-[13px] leading-[20px] text-[#93000a] bg-[#ffdad6]"
          role="alert"
        >
          {error instanceof AdminRequestError ? error.message : 'Không thể kết nối. Vui lòng thử lại.'}
        </p>
      )}
      <ActionSubmitBar remove={task.kind === 'remove'} pending={pending} onClose={onClose} />
    </form>
  );
}
