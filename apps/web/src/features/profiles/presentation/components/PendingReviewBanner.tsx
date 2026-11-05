import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Thông báo giấy tờ đang chờ người chăm sóc chính kiểm tra; chỉ hiện khi có giấy tờ chờ.
export function PendingReviewBanner({ count }: { count: number | undefined }) {
  if (!count) return null;
  return (
    <section className="mt-3.5 flex items-center justify-between gap-3 rounded-xl bg-[#deebea] p-3.5 shadow-xs lg:mt-0 lg:mb-10 lg:items-start lg:justify-start lg:gap-4 lg:rounded-2xl lg:bg-[#eaf6f5] lg:p-6 lg:shadow-sm">
      <div className="flex min-w-0 items-center gap-2.5 lg:contents">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ffdbc9] text-[#833b00] shadow-inner lg:h-12 lg:w-12 lg:rounded-xl lg:bg-white lg:text-[#004135] lg:shadow-sm">
          <AdminIcon name="pending_actions" size={22} />
        </span>
        <div className="min-w-0 lg:flex lg:flex-1 lg:flex-col lg:gap-1">
          <p className="truncate text-xs font-semibold text-[#131d1d] lg:text-lg">
            <span className="lg:hidden">Chờ phê duyệt hồ sơ</span>
            <span className="hidden lg:inline">Chờ duyệt: {count} giấy tờ y tế mới</span>
          </p>
          <p className="truncate text-[13px] leading-5 text-[#404945]">
            <span className="lg:hidden">{count} tài liệu sức khỏe mới tải lên</span>
            <span className="hidden lg:inline">
              Giấy tờ vừa tải lên đang chờ bạn kiểm tra trước khi lưu vào hồ sơ thành viên.
            </span>
          </p>
          <Link
            to="/review"
            className="hidden w-fit items-center gap-1.5 pt-2 text-xs font-semibold text-[#004135] hover:underline focus-visible:outline-2 focus-visible:outline-[#286958] lg:inline-flex"
          >
            Kiểm tra và xác nhận ngay
            <AdminIcon name="arrow_forward" size={16} />
          </Link>
        </div>
      </div>
      <Link
        to="/review"
        className="inline-flex min-h-9 shrink-0 items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#004135] shadow-xs active:scale-95 focus-visible:outline-2 focus-visible:outline-[#286958] lg:hidden"
      >
        Duyệt ngay
      </Link>
    </section>
  );
}
