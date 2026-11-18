import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
export function HouseholdRoleNotice() {
  return (
    <div className="household-start-role">
      <span className="household-start-role-icon">
        <AdminIcon name="admin_panel_settings" size={22} />
      </span>
      <div>
        <div className="household-role-heading">
          <strong className="household-role-desktop">Vai trò trong nhà</strong>
          <strong className="household-role-mobile">Bạn sẽ là Chủ hộ</strong>
          <b>
            <span className="household-role-desktop">Chủ hộ</span>
            <span className="household-role-mobile">Đặc quyền</span>
          </b>
        </div>
        <p>
          Bạn sẽ là <strong>Chủ hộ</strong> của nhà này. Bạn có thể quản lý hồ sơ và mời thêm thành viên trong
          gia đình.
        </p>
      </div>
    </div>
  );
}
