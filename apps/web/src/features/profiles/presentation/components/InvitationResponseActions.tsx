import type { InvitationDecision, InvitationView } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';
export function InvitationResponseActions({
  view,
  accountName,
  pending,
  onDecision,
}: {
  view: InvitationView;
  accountName: string;
  pending: boolean;
  onDecision: (decision: InvitationDecision) => void;
}) {
  return (
    <div className="mt-6">
      <p className="rounded-xl bg-accent-soft p-4 text-sm leading-6 font-medium text-accent">
        Bạn đang đăng nhập là <span className="break-words">{accountName}</span>. Hồ sơ "{view.profileName}"
        sẽ gắn với tài khoản này.
      </p>
      {view.consentNote === 'withdrawn_before' && (
        <p className="mt-3 text-[13px] leading-6 text-text-secondary">
          Hồ sơ này từng bị rút đồng thuận. Nếu bạn đồng ý, AN GIA sẽ lưu thông tin sức khỏe của hồ sơ trở
          lại.
        </p>
      )}
      <p className="mt-3 flex items-start gap-2.5 rounded-lg bg-accent-soft/70 p-3 text-xs leading-5 text-text-secondary">
        <InvitationIcon name="info" />
        <span>
          Nếu link này không dành cho bạn, đừng bấm nút nào: hãy đóng trang và báo cho người gửi. Bấm{' '}
          <strong>Không đồng ý</strong> sẽ dừng lưu thông tin sức khỏe của hồ sơ.
        </span>
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => onDecision('accepted')}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent disabled:opacity-55"
        >
          <InvitationIcon name="check" />
          {pending ? 'Đang gửi…' : 'Liên kết và đồng ý'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => onDecision('declined')}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent-soft px-5 py-3 text-sm font-semibold disabled:opacity-55"
        >
          <InvitationIcon name="close" />
          Không đồng ý
        </button>
      </div>
    </div>
  );
}
