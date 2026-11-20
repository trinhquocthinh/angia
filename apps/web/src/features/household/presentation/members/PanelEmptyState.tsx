import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

export function PanelEmptyState() {
  return (
    <div className="household-member-panel household-member-panel-empty">
      <div className="household-member-panel-empty-icon" aria-hidden="true">
        <AdminIcon name="manage_accounts" size={28} />
      </div>
      <p>Chọn một người trong danh sách để đổi vai trò hoặc gỡ khỏi nhà.</p>
    </div>
  );
}
