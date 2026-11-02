import type { InvitationView } from '../../application/invitationPorts';
// Không có nút quyết định: API sẽ trả 409 cho cả hai lựa chọn (SPEC-040).
export function InvitationBlocked({ reason }: { reason: InvitationView['reason'] }) {
  return (
    <p role="status" className="mt-6 rounded-xl bg-[#eaf6f5] p-4 text-sm leading-6 text-[#404945]">
      {reason === 'account_already_linked'
        ? 'Tài khoản của bạn đã liên kết với một hồ sơ khác nên không xác nhận được link này.'
        : reason === 'profile_already_linked'
          ? 'Hồ sơ này đã có tài khoản liên kết.'
          : 'Tài khoản của bạn không xác nhận được link này.'}
    </p>
  );
}
