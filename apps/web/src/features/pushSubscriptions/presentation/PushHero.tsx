import { Link } from '@tanstack/react-router';
import { PushIcon } from './PushIcon';

// Đầu trang: desktop có lối về + tiêu đề lớn; di động chỉ giữ dòng "Cấu hình an tâm" (tiêu đề nằm trong thẻ chính).
export function PushHero() {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="hidden min-h-11 items-center gap-2 text-[15px] text-[#286958] hover:text-[#004135] focus-visible:outline-2 focus-visible:outline-[#286958] lg:inline-flex"
        >
          <PushIcon name="back" size={18} /> Về AN GIA
        </Link>
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#286958] uppercase lg:hidden">
          <span className="h-2.5 w-2.5 rounded-full bg-[#286958]" aria-hidden="true" />
          Cấu hình an tâm
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-[#aef0da] px-3 py-1 text-xs font-medium text-[#055141] lg:bg-[#eaf6f5] lg:text-sm lg:font-semibold lg:text-[#004135]">
          <span className="hidden h-2 w-2 rounded-full bg-[#286958] lg:inline-block" aria-hidden="true" />
          Thiết bị hiện tại
        </span>
      </div>
      <div className="hidden lg:block">
        <p className="flex items-center gap-2 text-xs tracking-wider text-[#404945] uppercase">
          <PushIcon name="ring" size={16} /> Hệ thống thông báo sức khỏe gia đình
        </p>
        <h1 className="mt-3 font-['Newsreader',Georgia,serif] text-[44px] leading-tight font-semibold text-[#131d1d]">
          Thông báo trên thiết bị này
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#404945]">
          Bật nhận thông báo từ AN GIA. Màn hình khóa chỉ hiện “Đến giờ dùng thuốc”. Chi tiết được xem sau khi
          đăng nhập và kiểm tra quyền.
        </p>
      </div>
    </>
  );
}
