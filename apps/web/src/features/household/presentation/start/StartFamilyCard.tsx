import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
export function StartFamilyCard() {
  return (
    <aside className="household-start-family">
      <div>
        <strong>
          <AdminIcon name="family_restroom" size={18} />
          Đồng hành trọn vẹn
        </strong>
        <p>Cùng lưu sổ sức khỏe cho cha mẹ, con và những người thân trong gia đình.</p>
      </div>
      <img src="/images/household/family-onboarding.jpg" alt="" width="64" height="64" />
    </aside>
  );
}
