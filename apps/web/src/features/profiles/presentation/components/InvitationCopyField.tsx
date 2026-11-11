import { InvitationLinkInput } from './InvitationLinkInput';
import { useState } from 'react';
import type { InvitationCreated } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';
export function InvitationCopyField({ created }: { created: InvitationCreated }) {
  const [message, setMessage] = useState('');
  const { url } = created;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Đã sao chép link.');
    } catch {
      setMessage('Không thể sao chép tự động. Hãy chọn và sao chép link bên dưới.');
    }
  };
  const time = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(created.expiresAt));
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="invitation-link" className="text-xs font-medium">
          Link liên kết mới
        </label>
        <span className="flex items-center gap-1.5 text-[11px] text-accent">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none"
          />
          Link vừa tạo
        </span>
      </div>
      <InvitationLinkInput url={url} onCopy={() => void copy()} />
      <p className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-text-secondary">
        <InvitationIcon name="calendar" />
        <span>
          Hết hạn: <strong className="font-semibold">{time}</strong> (giờ Việt Nam).
        </span>
      </p>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent hover:bg-accent-hover"
      >
        <InvitationIcon name="copy" />
        Sao chép link
      </button>
      <p role="status" aria-live="polite" className="mt-2 text-xs leading-5 text-accent">
        {message}
      </p>
    </div>
  );
}
