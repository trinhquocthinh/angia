import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
export function HouseholdCreationFootnote() {
  return (
    <>
      <p className="household-create-footnote">
        <AdminIcon name="verified_user" size={18} />
        <span>Thêm hồ sơ người thân sau khi tạo nhà.</span>
      </p>
      <aside className="household-create-ready">
        <span className="household-start-icon">
          <AdminIcon name="folder_shared" size={26} />
        </span>
        <div>
          <strong>Sẵn sàng lập sổ sức khỏe số</strong>
          <p>Thêm hồ sơ và lưu giấy tờ sức khỏe sau khi hoàn tất.</p>
        </div>
      </aside>
    </>
  );
}
