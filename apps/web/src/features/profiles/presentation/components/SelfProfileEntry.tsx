import { Link } from '@tanstack/react-router';

// Lối vào "Hồ sơ của tôi" trên trang chủ của member đã liên kết (Design §9.1).
export function SelfProfileEntry() {
  return (
    <section className="flex flex-col items-start gap-4 rounded-2xl bg-white p-8">
      <h2 className="auth-heading text-2xl text-[#004135]">Hồ sơ của tôi</h2>
      <p className="text-sm leading-7 text-[#55615f]">
        Xem thuốc hôm nay, lịch hẹn và diễn biến của chính bạn. Người chăm sóc chính vẫn là người nhập và sửa
        dữ liệu.
      </p>
      <Link
        to="/my-profile"
        className="min-h-[52px] content-center rounded-full bg-[#004135] px-6 font-semibold text-white"
      >
        Mở hồ sơ của tôi
      </Link>
    </section>
  );
}
