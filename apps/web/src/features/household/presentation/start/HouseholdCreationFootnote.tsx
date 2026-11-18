import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
export function HouseholdCreationFootnote() {
  return (
    <p className="household-create-footnote">
      <AdminIcon name="verified_user" size={18} />
      <span>Thêm hồ sơ người thân sau khi tạo nhà.</span>
    </p>
  );
}
