import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import './profile-footer.css';

// Chưa có trang hướng dẫn/trợ giúp: giữ chỗ theo thiết kế, ở trạng thái vô hiệu.
export function ProfileFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="profile-footer">
      <div className="profile-footer-content">
        <p className="profile-footer-copyright">
          AN GIA © {year} • Sổ tay chăm sóc gia đình. Bảo lưu mọi quyền.
        </p>
        <div className="profile-footer-links">
          <span aria-disabled="true" title="Sắp ra mắt" className="profile-footer-soon">
            <span className="profile-footer-icon">
              <AdminIcon name="menu_book" size={18} />
            </span>
            Hướng dẫn sử dụng
          </span>
          <span aria-hidden="true" className="profile-footer-separator">
            •
          </span>
          <span aria-disabled="true" title="Sắp ra mắt" className="profile-footer-soon">
            <span className="profile-footer-icon">
              <AdminIcon name="help" size={18} />
            </span>
            Trung tâm trợ giúp
          </span>
        </div>
      </div>
    </footer>
  );
}
