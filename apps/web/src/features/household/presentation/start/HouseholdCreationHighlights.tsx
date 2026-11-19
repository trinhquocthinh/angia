import { ClayIcon } from '@src/shared/ui/ClayIcon';
export function HouseholdCreationHighlights() {
  return (
    <div className="household-create-highlights">
      <div>
        <ClayIcon name="privacy" size={36} />
        <span>
          <strong>Không gian riêng</strong>
          <small>Dữ liệu theo nhà</small>
        </span>
      </div>
      <div>
        <ClayIcon name="family" size={36} />
        <span>
          <strong>Hồ sơ gia đình</strong>
          <small>Thêm sau khi tạo nhà</small>
        </span>
      </div>
    </div>
  );
}
