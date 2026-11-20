import { HomeClayGlyph } from '../home/HomeClayGlyph';

export function DeleteHouseholdHeading({ otherCount }: { otherCount: number }) {
  return (
    <div className="household-home-block-head">
      <div className="household-home-badge-icon household-home-badge-shield" aria-hidden="true">
        <HomeClayGlyph name="home-danger-shield" size={32} />
      </div>
      <div className="household-home-block-copy">
        <div className="household-delete-title-wrap">
          <h2 id="household-delete-title" className="household-delete-heading">
            Xoá nhà
          </h2>
          <span className="household-delete-danger-pill">VÙNG NGUY HIỂM</span>
        </div>
        <p>
          {otherCount > 0
            ? `Chỉ xoá được khi bạn là người duy nhất trong nhà. Hiện tại nhà còn ${otherCount} thành viên khác.`
            : 'Bạn là người duy nhất trong nhà. Xoá nhà sẽ xoá toàn bộ dữ liệu sức khoẻ và ảnh sau 24 giờ.'}
        </p>
      </div>
    </div>
  );
}
