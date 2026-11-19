import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { MobileBottomNavHomeIcon } from './MobileBottomNavHomeIcon';
import { MobileBottomNavPendingIcon } from './MobileBottomNavPendingIcon';
import { MobileBottomNavAddIcon } from './MobileBottomNavAddIcon';
import './mobile-bottom-nav.css';
import './mobile-bottom-nav-motion.css';

// Giữ các route và quyền hiện hành; icon dùng cố định bản 3D của Stitch.
export function MobileBottomNav({
  pendingCount,
  personal = false,
}: {
  pendingCount?: number | undefined;
  personal?: boolean;
}) {
  return (
    <nav aria-label="Điều hướng chính" className="mobile-bottom-nav">
      <div className="mobile-nav-dock">
        <div className="mobile-nav-items">
          <Link to="/" activeOptions={{ exact: true }} className="mobile-nav-tab">
            <span className="mobile-nav-icon">
              <MobileBottomNavHomeIcon />
            </span>
            <span className="mobile-nav-label">Trang chủ</span>
          </Link>
          {personal ? (
            <Link to="/my-profile" className="mobile-nav-tab">
              <span className="mobile-nav-icon">
                <AdminIcon name="person" size={28} />
              </span>
              <span className="mobile-nav-label">Hồ sơ của tôi</span>
            </Link>
          ) : (
            <>
              <Link to="/upload" className="mobile-nav-add">
                <span className="mobile-nav-fab">
                  <MobileBottomNavAddIcon />
                </span>
                <span className="mobile-nav-label">Thêm mới</span>
              </Link>
              <Link to="/review" className="mobile-nav-tab">
                <span className="mobile-nav-icon">
                  <MobileBottomNavPendingIcon />
                  {pendingCount && pendingCount > 0 ? (
                    <span className="mobile-nav-badge">
                      <span aria-hidden="true">{pendingCount}</span>
                      <span className="sr-only">, {pendingCount} giấy tờ chờ duyệt</span>
                    </span>
                  ) : null}
                </span>
                <span className="mobile-nav-label">Chờ duyệt</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
