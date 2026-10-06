import type { InvitationView } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';
export function InvitationSummary({ view }: { view: InvitationView }) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f0f0] px-2.5 py-1 text-[11px] text-[#404945]">
        <InvitationIcon name="shield" />
        Xác nhận quyền riêng tư
      </span>
      <h1 className="auth-heading mt-3 text-2xl font-semibold leading-8 text-[#004135]">
        Lời mời chia sẻ dữ liệu sức khỏe
      </h1>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#eaf6f5] p-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#aef0da] text-lg font-semibold text-[#2f6f5e]"
          >
            {Array.from(view.profileDisplayName)[0]}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-[#404945]">Hồ sơ tiếp nhận</p>
            <p className="break-words text-sm font-semibold text-[#004135]">
              Hồ sơ: {view.profileDisplayName}
            </p>
          </div>
        </div>
        {view.inviterDisplayName && (
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-[#404945]">Người gửi lời mời</p>
            <p className="break-words text-sm font-medium text-[#286958]">{view.inviterDisplayName}</p>
          </div>
        )}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#e4f0f0] p-4 text-[#404945]">
        <span className="mt-0.5 text-[#286958]">
          <InvitationIcon name="shield" />
        </span>
        <p className="text-[13px] leading-6">
          Bạn được mời chia sẻ và lưu trữ dữ liệu sức khỏe trong nhóm gia đình. Ảnh chứng từ có thể được gửi
          tới dịch vụ AI ở nước ngoài để trích xuất thông tin. Bạn có thể đồng ý hoặc từ chối.
        </p>
      </div>
    </>
  );
}
