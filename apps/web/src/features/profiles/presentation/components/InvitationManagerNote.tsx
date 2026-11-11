import { InvitationIcon } from './InvitationIcon';
export function InvitationManagerNote() {
  return (
    <>
      <p id="invitation-description" className="mt-6 text-sm leading-6 text-text-secondary">
        Gửi link cho chính người có tên trong hồ sơ. Họ đăng nhập bằng tài khoản của mình rồi tự chọn "Liên
        kết và đồng ý" hoặc "Không đồng ý". Đừng mở link bằng tài khoản của bạn nếu hồ sơ không phải của bạn.
      </p>
      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-accent-soft p-4 text-text-secondary">
        <span className="mt-0.5 text-accent">
          <InvitationIcon name="shield" />
        </span>
        <p className="text-xs leading-5">
          Link dùng một lần, có hiệu lực <strong>7 ngày</strong>. Tạo link mới sẽ làm link trước mất hiệu lực.
          Bạn cần sao chép trước khi đóng; link không được lưu để đọc lại.
        </p>
      </div>
    </>
  );
}
