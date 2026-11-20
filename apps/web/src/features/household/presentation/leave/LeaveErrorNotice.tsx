import { Link } from '@tanstack/react-router';
import { HomeClayGlyph } from '../home/HomeClayGlyph';

const AMBER_CODES = new Set(['ERR_OWNER_MUST_TRANSFER', 'ERR_OWNER_MUST_DELETE_FAMILY', 'ERR_LAST_GUARDIAN']);

type Props = {
  error: string;
  errorCode: string | null;
  onGoToDelete?: () => void;
};

export function LeaveErrorNotice({ error, errorCode, onGoToDelete }: Props) {
  if (!errorCode || !AMBER_CODES.has(errorCode)) {
    return (
      <p role="alert" className="household-home-error-alert">
        {error}
      </p>
    );
  }
  return (
    <div role="alert" className="household-home-amber-banner">
      <div className="household-home-amber-copy">
        <span className="household-home-amber-icon" aria-hidden="true">
          <HomeClayGlyph name="home-warning" size={16} />
        </span>
        <span>{error}</span>
      </div>
      {errorCode === 'ERR_OWNER_MUST_DELETE_FAMILY' && onGoToDelete && (
        <button type="button" className="household-home-amber-link" onClick={onGoToDelete}>
          Đi tới mục Xoá nhà
        </button>
      )}
      {errorCode === 'ERR_LAST_GUARDIAN' && (
        <Link to="/" className="household-home-amber-link">
          Xem danh sách hồ sơ
        </Link>
      )}
    </div>
  );
}
