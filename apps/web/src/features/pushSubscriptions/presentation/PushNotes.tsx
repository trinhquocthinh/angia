import { PushNote } from './PushNote';

export function PushNotes() {
  return (
    <>
      <PushNote icon="shield" title="Bảo vệ dữ liệu sức khỏe" className="hidden bg-accent-soft lg:flex">
        Thông báo đẩy chỉ mang lời nhắc chung. Tên thuốc, liều lượng và thành viên không nằm trong thông báo;
        chỉ xem được sau khi đăng nhập AN GIA và kiểm tra quyền.
      </PushNote>
      <PushNote icon="info" title="Lưu ý hoạt động nền" className="bg-accent-soft lg:bg-surface">
        Đóng ứng dụng hoặc hết phiên đăng nhập không tự tắt thông báo. Đăng xuất hoặc chọn{' '}
        <strong className="font-semibold text-text-primary">“Tắt thông báo”</strong> sẽ ngừng gửi mới trên
        thiết bị này. Thông báo đã gửi có thể đến muộn.
      </PushNote>
    </>
  );
}
