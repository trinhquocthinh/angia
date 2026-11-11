import { Link } from '@tanstack/react-router';
import type { InvitationReceipt } from '../../application/invitationPorts';
export function InvitationTerminal({ receipt }: { receipt: InvitationReceipt }) {
  const linked = receipt.outcome === 'linked';
  return (
    <section className="rounded-xl bg-accent-soft p-5">
      <h1 className="text-lg font-semibold text-accent">{linked ? 'Đã liên kết hồ sơ' : 'Đã ghi nhận'}</h1>
      <p role="status" aria-live="polite" className="mt-3 break-words text-sm leading-7">
        {linked
          ? `Hồ sơ "${receipt.profileName}" đã gắn với tài khoản của bạn.`
          : `Bạn đã không đồng ý. Hồ sơ "${receipt.profileName}" không gắn với tài khoản của bạn.`}
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent"
      >
        Về Trang chủ
      </Link>
    </section>
  );
}
