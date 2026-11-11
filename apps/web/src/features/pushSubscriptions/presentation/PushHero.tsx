import { Link } from '@tanstack/react-router';
import { PushIcon } from './PushIcon';

// Đầu trang: desktop có lối về + tiêu đề lớn; di động chỉ giữ dòng "Cấu hình an tâm" (tiêu đề nằm trong thẻ chính).
export function PushHero() {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="hidden min-h-11 items-center gap-2 text-[15px] text-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-focus lg:inline-flex"
        >
          <PushIcon name="back" size={18} /> Về AN GIA
        </Link>
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent uppercase lg:hidden">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
          Cấu hình an tâm
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent lg:bg-accent-soft lg:text-sm lg:font-semibold lg:text-accent">
          <span className="hidden h-2 w-2 rounded-full bg-accent lg:inline-block" aria-hidden="true" />
          Thiết bị hiện tại
        </span>
      </div>
      <div className="hidden lg:block">
        <p className="flex items-center gap-2 text-xs tracking-wider text-text-secondary uppercase">
          <PushIcon name="ring" size={16} /> Hệ thống thông báo sức khỏe gia đình
        </p>
        <h1 className="mt-3 font-['Newsreader',Georgia,serif] text-[44px] leading-tight font-semibold text-text-primary">
          Thông báo trên thiết bị này
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary">
          Bật nhận thông báo từ AN GIA. Màn hình khóa chỉ hiện “Đến giờ dùng thuốc”. Chi tiết được xem sau khi
          đăng nhập và kiểm tra quyền.
        </p>
      </div>
    </>
  );
}
