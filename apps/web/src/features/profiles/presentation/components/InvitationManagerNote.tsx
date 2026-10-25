import { InvitationIcon } from './InvitationIcon';
export function InvitationManagerNote() {
  return (
    <>
      <p id="invitation-description" className="mt-6 text-sm leading-6 text-[#404945]">
        Gửi link cho người thân có tên trong hồ sơ (hoặc người đại diện/chăm sóc). Người nhận không cần tài
        khoản hay mật khẩu và tự chọn đồng ý hoặc từ chối.
      </p>
      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#eaf6f5] p-4 text-[#404945]">
        <span className="mt-0.5 text-[#286958]">
          <InvitationIcon name="shield" />
        </span>
        <p className="text-xs leading-5">
          Link có hiệu lực <strong>7 ngày</strong>. Tạo link mới sẽ làm link trước mất hiệu lực. Bạn cần sao
          chép trước khi đóng; link không được lưu để đọc lại.
        </p>
      </div>
    </>
  );
}
