import { Link } from '@tanstack/react-router';

const navItem =
  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium tracking-[0.03em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]';
const active = { className: 'bg-[#004135] font-semibold text-white shadow-sm' };
const idle = { className: 'text-[#404945] hover:text-[#131d1d]' };

// Điều hướng chính dạng nhóm nút trên header desktop; số giấy tờ chờ duyệt hiện cạnh mục "Chờ duyệt".
export function TopbarNav({ pendingCount }: { pendingCount?: number | undefined }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="flex shrink-0 items-center gap-1 rounded-xl bg-[#eaf6f5] p-1"
    >
      <Link
        to="/"
        activeOptions={{ exact: true }}
        className={navItem}
        activeProps={active}
        inactiveProps={idle}
      >
        Trang chủ
      </Link>
      <Link to="/upload" className={navItem} activeProps={active} inactiveProps={idle}>
        Tải giấy tờ
      </Link>
      <Link to="/review" className={navItem} activeProps={active} inactiveProps={idle}>
        Chờ duyệt
        {pendingCount ? (
          <span className="inline-flex items-center justify-center rounded-full bg-[#ba1a1a] px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
            <span className="sr-only">, </span>
            {pendingCount}
            <span className="sr-only"> giấy tờ</span>
          </span>
        ) : null}
      </Link>
    </nav>
  );
}
