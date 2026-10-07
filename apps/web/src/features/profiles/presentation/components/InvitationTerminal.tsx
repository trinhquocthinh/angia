import type { InvitationReceipt } from '../../application/invitationPorts';
import { invitationReceiptMessage } from '../invitationReceiptMessage';
export function InvitationTerminal({
  status,
  receipt,
}: {
  status: 'accepted' | 'declined';
  receipt: InvitationReceipt | null;
}) {
  return (
    <section className="mt-6 rounded-xl bg-[#eaf6f5] p-5">
      <h2 className="text-lg font-semibold text-[#004135]">
        {status === 'accepted' ? 'Lời mời đã được đồng ý' : 'Lời mời đã bị từ chối'}
      </h2>
      <p role="status" aria-live="polite" className="mt-3 break-words text-sm leading-7">
        {receipt
          ? invitationReceiptMessage(receipt)
          : 'Phản hồi đã được ghi nhận. Lời mời này không nhận thêm quyết định.'}
      </p>
      <p className="mt-3 text-sm leading-6 text-[#55615f]">
        Danh tính và tư cách người phản hồi là tự khai, chưa được xác minh.
      </p>
    </section>
  );
}
