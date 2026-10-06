import { InvitationIcon } from './InvitationIcon';
export function InvitationManagerActions({
  invitationState,
  pending,
  create,
  revoke,
}: {
  invitationState: 'none' | 'active' | 'uncertain';
  pending: boolean;
  create: () => Promise<void>;
  revoke: () => Promise<void>;
}) {
  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => void create()}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-55 ${invitationState === 'none' ? 'bg-[#004135] text-white hover:bg-[#20594b]' : 'bg-[#eaf6f5] text-[#286958] hover:bg-[#deebea]'}`}
      >
        <InvitationIcon name="refresh" />
        {pending
          ? 'Đang xử lý…'
          : invitationState === 'active'
            ? 'Tạo lại link đồng thuận'
            : 'Tạo link đồng thuận'}
      </button>
      {invitationState !== 'none' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => void revoke()}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/30 disabled:opacity-55"
        >
          <InvitationIcon name="unlink" />
          Thu hồi link chờ phản hồi
        </button>
      )}
    </div>
  );
}
