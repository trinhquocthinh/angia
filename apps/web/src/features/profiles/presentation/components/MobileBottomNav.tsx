import { Link } from '@tanstack/react-router';
import { ProfileIcon } from './ProfileIcon';

const item =
  'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-xs font-medium text-[#404945] focus-visible:outline-2 focus-visible:outline-[#286958]';
const active = { className: 'font-semibold text-[#004135]' };

// Thanh điều hướng đáy màn hình cho di động/máy tính bảng (< lg), thay cho sidebar.
export function MobileBottomNav({ pendingCount }: { pendingCount?: number | undefined }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 bg-[#f0fcfb]/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        <Link to="/" activeOptions={{ exact: true }} className={item} activeProps={active}>
          <ProfileIcon name="home" size={24} />
          Nhà
        </Link>
        <Link to="/upload" className={`group ${item}`} activeProps={active}>
          <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#004135] text-white shadow-[0_4px_12px_rgba(32,89,75,0.25)] transition-transform group-active:scale-95">
            <ProfileIcon name="add" size={24} />
          </span>
          Thêm
        </Link>
        <Link to="/review" className={item} activeProps={active}>
          <span className="relative">
            <ProfileIcon name="review" size={24} />
            {pendingCount ? (
              <span className="absolute -top-1.5 -right-2.5 min-w-5 rounded-full bg-[#b3eddf] px-1 text-center text-[11px] leading-5 font-semibold text-[#004135]">
                <span className="sr-only">, </span>
                {pendingCount}
                <span className="sr-only"> giấy tờ</span>
              </span>
            ) : null}
          </span>
          Chờ duyệt
        </Link>
      </div>
    </nav>
  );
}
