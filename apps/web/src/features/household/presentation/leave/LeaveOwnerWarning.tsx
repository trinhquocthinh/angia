import { HomeClayGlyph } from '../home/HomeClayGlyph';

type Props = {
  otherCount: number;
  onScrollToDelete: () => void;
};

export function LeaveOwnerWarning({ otherCount, onScrollToDelete }: Props) {
  return (
    <div className="household-home-amber-banner" role="note">
      <div className="household-home-amber-copy">
        <span className="household-home-amber-icon" aria-hidden="true">
          <HomeClayGlyph name="home-warning" size={16} />
        </span>
        <span>
          {otherCount > 0
            ? 'Hãy trao quyền Chủ hộ cho người khác trước khi rời nhà.'
            : 'Bạn là người duy nhất trong nhà. Hãy xoá nhà thay vì rời nhà.'}
        </span>
      </div>
      {otherCount === 0 && (
        <button type="button" className="household-home-amber-link" onClick={onScrollToDelete}>
          Đi tới mục Xoá nhà
        </button>
      )}
    </div>
  );
}
