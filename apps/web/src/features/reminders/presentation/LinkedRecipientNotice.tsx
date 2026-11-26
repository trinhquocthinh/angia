import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// BR-039: hồ sơ liên kết tài khoản nhận nhắc qua chính tài khoản đó, không đổi được nên chỉ hiển thị.
export function LinkedRecipientNotice({ displayName }: { displayName: string }) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl border border-accent/20 bg-accent-soft p-4">
      <span className="reminder-ceramic-avatar reminder-ceramic-avatar-sm" aria-hidden="true">
        {(displayName || '?').slice(0, 1)}
        <span className="reminder-ceramic-badge">
          <AdminIcon name="verified_user" size={13} />
        </span>
      </span>
      <p className="min-w-0 self-center text-body break-words text-text-secondary">
        Hồ sơ có tài khoản liên kết nên nhắc thuốc gửi tới tài khoản liên kết:{' '}
        <strong className="font-semibold text-text-primary">{displayName}</strong>.
      </p>
    </div>
  );
}
