import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

const item =
  'flex min-h-12 min-w-14 flex-1 flex-col items-center justify-center text-base leading-5 font-medium tracking-[0.03em] text-text-secondary transition-colors focus-visible:outline-2 focus-visible:outline-focus';
const active = { className: 'font-semibold text-accent' };

// Thanh điều hướng đáy màn hình cho di động/máy tính bảng (< lg), thay cho điều hướng trên header.
// Khung cá nhân (Design §9.1): member đã liên kết không có mục Thêm mới/Chờ duyệt.
export function MobileBottomNav({
  pendingCount,
  personal = false,
}: {
  pendingCount?: number | undefined;
  personal?: boolean;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 bg-surface-raised/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_color-mix(in_srgb,var(--color-shadow)_5%,transparent)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        <Link to="/" activeOptions={{ exact: true }} className={`gap-0.5 ${item}`} activeProps={active}>
          <AdminIcon name="home_health" size={24} />
          Trang chủ
        </Link>
        {personal ? (
          <Link to="/my-profile" className={`gap-0.5 ${item}`} activeProps={active}>
            <AdminIcon name="person" size={24} />
            Hồ sơ của tôi
          </Link>
        ) : (
          <>
            <Link to="/upload" className={`group -mt-4 gap-1 ${item}`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_4px_12px_color-mix(in_srgb,var(--color-shadow)_30%,transparent)] transition-transform group-active:scale-95">
                <AdminIcon name="add" size={28} />
              </span>
              Thêm mới
            </Link>
            <Link to="/review" className={`relative gap-0.5 ${item}`} activeProps={active}>
              <AdminIcon name="pending_actions" size={24} />
              Chờ duyệt
              {pendingCount ? (
                <span className="absolute top-1 right-[calc(50%-18px)] h-1.5 w-1.5 rounded-full bg-warning">
                  <span className="sr-only">, {pendingCount} giấy tờ</span>
                </span>
              ) : null}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
