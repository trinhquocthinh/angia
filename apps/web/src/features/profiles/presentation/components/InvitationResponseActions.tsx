import { InvitationIcon } from './InvitationIcon';
export function InvitationResponseActions({
  pending,
  canRespond,
  onDecision,
}: {
  pending: boolean;
  canRespond: boolean;
  onDecision: (decision: 'accepted' | 'declined') => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <button
        type="button"
        disabled={!canRespond || pending}
        onClick={() => onDecision('accepted')}
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#004135] px-5 py-3 text-sm font-semibold text-white disabled:opacity-55"
      >
        <InvitationIcon name="check" />
        {pending ? 'Đang gửi…' : 'Đồng ý chia sẻ dữ liệu'}
      </button>
      <button
        type="button"
        disabled={!canRespond || pending}
        onClick={() => onDecision('declined')}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#eaf6f5] px-5 py-3 text-sm font-semibold disabled:opacity-55"
      >
        <InvitationIcon name="close" />
        Từ chối chia sẻ dữ liệu
      </button>
    </div>
  );
}
