import { HomeClayGlyph } from '../home/HomeClayGlyph';

export function DeleteHouseholdInfoList() {
  return (
    <ul className="household-delete-info-list">
      <li>
        <span className="household-delete-info-icon household-delete-info-danger" aria-hidden="true">
          <HomeClayGlyph name="home-info-trash" size={14} />
        </span>
        <span>Toàn bộ dữ liệu sức khoẻ và ảnh của nhà bị xoá hẳn sau 24 giờ.</span>
      </li>
      <li>
        <span className="household-delete-info-icon household-delete-info-warning" aria-hidden="true">
          <HomeClayGlyph name="home-info-clock" size={14} />
        </span>
        <span>Trong 24 giờ, chỉ bạn thu hồi được yêu cầu.</span>
      </li>
      <li>
        <span className="household-delete-info-icon household-delete-info-success" aria-hidden="true">
          <HomeClayGlyph name="home-info-user" size={14} />
        </span>
        <span>Tài khoản của bạn còn lại, ở trạng thái chưa có nhà.</span>
      </li>
    </ul>
  );
}
