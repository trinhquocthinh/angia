import { HomeClayGlyph } from '../home/HomeClayGlyph';

export function OwnershipTransferHeading({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="household-home-block-head">
      <div className="household-home-badge-icon household-home-badge-crown" aria-hidden="true">
        <HomeClayGlyph name="home-crown" size={32} />
      </div>
      <div className="household-home-block-copy">
        <h2 id="household-ownership-title">Trao quyền Chủ hộ</h2>
        <p>
          {isOwner
            ? 'Chọn một Đồng quản lý để đề nghị làm Chủ hộ. Quyền chỉ đổi khi người đó chấp nhận. Bạn sẽ trở thành Đồng quản lý.'
            : 'Bạn nhận được đề nghị trở thành Chủ hộ của nhà. Quyền chỉ đổi khi bạn chấp nhận.'}
        </p>
      </div>
    </div>
  );
}
