import { Link } from '@tanstack/react-router';
import { StartIcon } from './StartIcon';
export function StartChoice({ create = false }: { create?: boolean }) {
  const content = (
    <>
      <span className="household-start-icon">
        <StartIcon name={create ? 'house' : 'invite'} />
      </span>
      <span className="household-start-choice-copy">
        <span className="household-choice-title">
          <strong>{create ? 'Tạo nhà mới' : 'Tôi có mã mời'}</strong>
          {create && <b>Mới</b>}
        </span>
        <span id={create ? undefined : 'household-invite-unavailable'}>
          {create ? 'Bắt đầu ghi sổ sức khỏe cho cả nhà.' : 'Nhập mã mời chưa khả dụng.'}
        </span>
      </span>
      <span className="household-start-chevron">
        <StartIcon name="chevron" />
      </span>
    </>
  );
  return create ? (
    <Link
      to="/waiting"
      search={{ step: 'create' }}
      className="household-start-choice household-start-choice-primary"
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      className="household-start-choice"
      disabled
      aria-describedby="household-invite-unavailable"
    >
      {content}
    </button>
  );
}
