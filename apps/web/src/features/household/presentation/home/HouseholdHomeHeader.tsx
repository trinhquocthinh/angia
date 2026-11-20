import { HomeClayGlyph } from './HomeClayGlyph';

type Props = {
  familyName: string;
  memberCount: number | null;
  hasPendingDeletion: boolean;
};

export function HouseholdHomeHeader({ familyName, memberCount, hasPendingDeletion }: Props) {
  const chipLabel = memberCount === null ? familyName : `${familyName} · ${memberCount} thành viên`;

  return (
    <header className="household-home-header">
      <div className="household-home-topbar">
        <span className="household-home-family-chip">
          <HomeClayGlyph name="home-chip" size={16} />
          <span>{chipLabel}</span>
        </span>
        <span className="household-home-section-label">Mục Quản lý tài khoản</span>
      </div>
      <div className="household-home-title-row">
        <h1 id="household-home-title">Nhà của tôi</h1>
        <span
          className={
            hasPendingDeletion
              ? 'household-home-status household-home-status-warning'
              : 'household-home-status'
          }
        >
          {hasPendingDeletion ? 'Đang chờ xoá' : 'Đang hoạt động'}
        </span>
      </div>
      <p className="household-home-subtitle">
        Thiết lập sở hữu, quyền quản lý và điều kiện thành viên trong mái ấm của gia đình.
      </p>
    </header>
  );
}
