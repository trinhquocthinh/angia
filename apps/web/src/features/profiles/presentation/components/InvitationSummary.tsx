import type { InvitationView } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';
export function InvitationSummary({ view }: { view: InvitationView }) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] text-text-secondary">
        <InvitationIcon name="shield" />
        Xác nhận quyền riêng tư
      </span>
      <h1 className="auth-heading mt-3 text-2xl font-semibold leading-8 text-accent">
        Liên kết tài khoản với hồ sơ sức khỏe
      </h1>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-accent-soft p-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent"
          >
            {Array.from(view.profileName)[0]}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-text-secondary">Hồ sơ</p>
            <p className="break-words text-sm font-semibold text-accent">{view.profileName}</p>
          </div>
        </div>
        {view.inviterName && (
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-text-secondary">Người gửi link</p>
            <p className="break-words text-sm font-medium text-accent">{view.inviterName}</p>
          </div>
        )}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-accent-soft p-4 text-text-secondary">
        <span className="mt-0.5 text-accent">
          <InvitationIcon name="shield" />
        </span>
        <div className="space-y-3 text-[13px] leading-6">
          <p>
            {view.inviterName ?? 'Người quản lý gia đình'} mời bạn gắn tài khoản với hồ sơ{' '}
            <strong>{view.profileName}</strong> và đồng ý lưu thông tin sức khỏe của hồ sơ vào sổ sức khỏe gia
            đình AN GIA: đơn thuốc, kết quả xét nghiệm, chỉ số đo và lịch nhắc uống thuốc. Ảnh giấy tờ khám có
            thể được gửi tới dịch vụ nhận diện tự động ở nước ngoài để trích xuất chữ, sau khi người quản lý
            gia đình đã che thông tin định danh trên ảnh.
          </p>
          <p>
            <strong>Quyền của bạn:</strong> bạn có quyền không đồng ý. Nếu đồng ý, sau này bạn vẫn có thể tự
            rút đồng thuận, gỡ liên kết hoặc yêu cầu người quản lý gia đình xóa toàn bộ hồ sơ.
          </p>
        </div>
      </div>
    </>
  );
}
