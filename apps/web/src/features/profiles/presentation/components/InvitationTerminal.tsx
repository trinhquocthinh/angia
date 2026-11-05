import { Link } from '@tanstack/react-router';
import type { InvitationReceipt } from '../../application/invitationPorts';
export function InvitationTerminal({ receipt }: { receipt: InvitationReceipt }) {
  const linked = receipt.outcome === 'linked';
  return (
    <section className="rounded-xl bg-[#eaf6f5] p-5">
      <h1 className="text-lg font-semibold text-[#004135]">{linked ? 'Đã liên kết hồ sơ' : 'Đã ghi nhận'}</h1>
      <p role="status" aria-live="polite" className="mt-3 break-words text-sm leading-7">
        {linked
          ? `Hồ sơ "${receipt.profileName}" đã gắn với tài khoản của bạn.`
          : `Bạn đã không đồng ý. Hồ sơ "${receipt.profileName}" không gắn với tài khoản của bạn.`}
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#004135] px-5 py-3 text-sm font-semibold text-white"
      >
        Về Trang chủ
      </Link>
    </section>
  );
}
