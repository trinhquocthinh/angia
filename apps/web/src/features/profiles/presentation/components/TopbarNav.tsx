import { Link } from '@tanstack/react-router';

const navItem =
  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium tracking-[0.03em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
const active = { className: 'bg-accent font-semibold text-on-accent shadow-sm' };
const idle = { className: 'text-text-secondary hover:text-text-primary' };

// Điều hướng chính dạng nhóm nút trên header desktop; số giấy tờ chờ duyệt hiện cạnh mục "Chờ duyệt".
// Khung cá nhân (Design §9.1): member đã liên kết không có mục gia đình.
export function TopbarNav({
  pendingCount,
  personal = false,
}: {
  pendingCount?: number | undefined;
  personal?: boolean;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="flex shrink-0 items-center gap-1 rounded-xl bg-accent-soft p-1"
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
      {personal ? (
        <Link to="/my-profile" className={navItem} activeProps={active} inactiveProps={idle}>
          Hồ sơ của tôi
        </Link>
      ) : (
        <>
          <Link to="/upload" className={navItem} activeProps={active} inactiveProps={idle}>
            Tải giấy tờ
          </Link>
          <Link to="/review" className={navItem} activeProps={active} inactiveProps={idle}>
            Chờ duyệt
            {pendingCount ? (
              <span className="inline-flex items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] leading-none font-bold text-on-accent">
                <span className="sr-only">, </span>
                {pendingCount}
                <span className="sr-only"> giấy tờ</span>
              </span>
            ) : null}
          </Link>
        </>
      )}
    </nav>
  );
}
