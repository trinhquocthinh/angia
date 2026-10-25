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
        Lời mời chia sẻ sổ sức khỏe gia đình
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
        <div className="space-y-3 text-[13px] leading-6">
          <p>
            {view.inviterDisplayName ?? 'Người quản lý gia đình'} mời bạn đồng ý lưu thông tin sức khỏe của hồ
            sơ <strong>{view.profileDisplayName}</strong> vào sổ sức khỏe gia đình AN GIA: đơn thuốc, kết quả
            xét nghiệm, chỉ số đo và lịch nhắc uống thuốc. Ảnh giấy tờ khám có thể được gửi tới dịch vụ nhận
            diện tự động ở nước ngoài để trích xuất chữ, sau khi người quản lý gia đình đã che thông tin định
            danh trên ảnh.
          </p>
          <p>
            <strong>Quyền của bạn:</strong> đây là thông tin sức khỏe của bạn (hoặc người bạn giám hộ). Bạn có
            quyền từ chối; từ chối không ảnh hưởng gì khác. Nếu đồng ý, sau này bạn vẫn có thể rút lại (nếu
            bạn có tài khoản AN GIA liên kết với hồ sơ) hoặc yêu cầu người mời xóa toàn bộ hồ sơ.
          </p>
        </div>
      </div>
    </>
  );
}
