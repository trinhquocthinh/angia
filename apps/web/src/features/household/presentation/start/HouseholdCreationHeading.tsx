import { ClayIcon } from '@src/shared/ui/ClayIcon';

export function HouseholdCreationHeading({ invited }: { invited: boolean }) {
  return (
    <div className="household-create-heading">
      <ClayIcon name="create-house" size={64} />
      <span>02 — Thiết lập gia đình</span>
      <h1 id="household-create-title">{invited ? 'Lập nhà mới theo lời mời' : 'Tạo nhà mới'}</h1>
      <p className="household-start-description">
        Đặt tên dễ nhớ cho không gian theo dõi và chăm sóc sức khỏe gia đình bạn.
      </p>
    </div>
  );
}
