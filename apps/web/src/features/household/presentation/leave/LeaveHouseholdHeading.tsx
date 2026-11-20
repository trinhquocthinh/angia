import { HomeClayGlyph } from '../home/HomeClayGlyph';

export function LeaveHouseholdHeading({
  familyName,
  isOwner,
  otherCount,
}: {
  familyName: string;
  isOwner: boolean;
  otherCount: number;
}) {
  return (
    <div className="household-home-block-head">
      <div className="household-home-badge-icon household-home-badge-door" aria-hidden="true">
        <HomeClayGlyph name="home-leave-door" size={32} />
      </div>
      <div className="household-home-block-copy">
        <div className="household-home-block-title-row">
          <h2 id="household-leave-title">Rời nhà</h2>
          {isOwner && otherCount > 0 && <span className="household-leave-tag">Yêu cầu chuyển quyền</span>}
        </div>
        <p>Rời khỏi {familyName} và không còn quản lý hoặc xem hồ sơ của các thành viên.</p>
      </div>
    </div>
  );
}
