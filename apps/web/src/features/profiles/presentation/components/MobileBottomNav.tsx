import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

const item =
  'flex min-h-11 min-w-14 flex-1 flex-col items-center justify-center text-[11px] leading-[14px] font-medium tracking-[0.03em] text-[#404945] transition-colors focus-visible:outline-2 focus-visible:outline-[#286958]';
const active = { className: 'font-semibold text-[#004135]' };

// Thanh điều hướng đáy màn hình cho di động/máy tính bảng (< lg), thay cho điều hướng trên header.
export function MobileBottomNav({ pendingCount }: { pendingCount?: number | undefined }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 bg-[#f0fcfb]/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(19,29,29,0.05)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        <Link to="/" activeOptions={{ exact: true }} className={`gap-0.5 ${item}`} activeProps={active}>
          <AdminIcon name="home_health" size={24} />
          Trang chủ
        </Link>
        <Link to="/upload" className={`group -mt-4 gap-1 ${item}`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#004135] text-white shadow-[0_4px_12px_rgba(0,65,53,0.3)] transition-transform group-active:scale-95">
            <AdminIcon name="add" size={28} />
          </span>
          Thêm mới
        </Link>
        <Link to="/review" className={`relative gap-0.5 ${item}`} activeProps={active}>
          <AdminIcon name="pending_actions" size={24} />
          Chờ duyệt
          {pendingCount ? (
            <span className="absolute top-1 right-[calc(50%-18px)] h-1.5 w-1.5 rounded-full bg-[#833b00]">
              <span className="sr-only">, {pendingCount} giấy tờ</span>
            </span>
          ) : null}
        </Link>
      </div>
    </nav>
  );
}
