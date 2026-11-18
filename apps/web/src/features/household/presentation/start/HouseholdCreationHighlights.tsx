import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
export function HouseholdCreationHighlights() {
  return (
    <div className="household-create-highlights">
      <div>
        <AdminIcon name="shield" />
        <span>
          <strong>Không gian riêng</strong>
          <small>Dữ liệu theo nhà</small>
        </span>
      </div>
      <div>
        <AdminIcon name="group_add" />
        <span>
          <strong>Hồ sơ gia đình</strong>
          <small>Thêm sau khi tạo nhà</small>
        </span>
      </div>
    </div>
  );
}
