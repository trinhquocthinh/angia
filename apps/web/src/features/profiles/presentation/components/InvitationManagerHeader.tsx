import { InvitationIcon } from './InvitationIcon';
export function InvitationManagerHeader({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 id="invitation-title" className="auth-heading text-2xl font-semibold leading-8 text-accent">
          Link liên kết tài khoản
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-soft text-xs font-semibold text-warning"
          >
            {Array.from(name)[0]}
          </span>
          <p className="break-words text-sm">Hồ sơ: {name}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng quản lý link"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-text-secondary hover:bg-border [&_svg]:size-4"
      >
        <InvitationIcon name="close" />
      </button>
    </div>
  );
}
