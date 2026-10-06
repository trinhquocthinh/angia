import { InvitationLinkInput } from './InvitationLinkInput';
import { invitationLink } from '../invitationLink';
import { useState } from 'react';
import type { InvitationCreated } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';
export function InvitationCopyField({ created }: { created: InvitationCreated }) {
  const [message, setMessage] = useState('');
  const url = invitationLink(window.location.origin, created.token);
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
          Link mời mới
        </label>
        <span className="flex items-center gap-1.5 text-[11px] text-[#286958]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#286958] motion-reduce:animate-none"
          />
          Link vừa tạo
        </span>
      </div>
      <InvitationLinkInput url={url} onCopy={() => void copy()} />
      <p className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-[#404945]">
        <InvitationIcon name="calendar" />
        <span>
          Hết hạn: <strong className="font-semibold">{time}</strong> (giờ Việt Nam).
        </span>
      </p>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#004135] px-5 py-3 text-sm font-semibold text-white hover:bg-[#20594b]"
      >
        <InvitationIcon name="copy" />
        Sao chép link
      </button>
      <p role="status" aria-live="polite" className="mt-2 text-xs leading-5 text-[#286958]">
        {message}
      </p>
    </div>
  );
}
