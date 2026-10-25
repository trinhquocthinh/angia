import { useState } from 'react';
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
  const [attested, setAttested] = useState(false);
  const submit = async () => {
    await create();
    setAttested(false);
  };
  return (
    <div className="mt-3 space-y-2">
      <label className="flex items-start gap-2.5 rounded-xl bg-[#eaf6f5] p-3 text-xs leading-5 text-[#404945]">
        <input
          type="checkbox"
          checked={attested}
          disabled={pending}
          onChange={(event) => setAttested(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#004135]"
        />
        <span>
          Tôi xác nhận sẽ gửi link này cho chính người có tên trong hồ sơ, hoặc người giám hộ hợp pháp nếu
          người đó là trẻ em hay không tự quyết định được, và để họ tự chọn đồng ý hoặc từ chối. Tôi không tự
          bấm thay.
        </span>
      </label>
      <button
        type="button"
        disabled={pending || !attested}
        onClick={() => void submit()}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-55 ${invitationState === 'none' ? 'bg-[#004135] text-white hover:bg-[#20594b]' : 'bg-[#eaf6f5] text-[#286958] hover:bg-[#deebea]'}`}
      >
        <InvitationIcon name="refresh" />
        {pending
          ? 'Đang xử lý…'
          : invitationState === 'active'
            ? 'Tạo lại link xác nhận'
            : 'Tạo link xác nhận'}
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
