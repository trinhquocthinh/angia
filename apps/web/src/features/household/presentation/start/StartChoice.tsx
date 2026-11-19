import { Link } from '@tanstack/react-router';
import { Arrow3d } from '@src/shared/ui/Arrow3d';
import { HouseholdClayIcon } from './HouseholdClayIcon';
export function StartChoice({ create = false }: { create?: boolean }) {
  const content = (
    <>
      <span className="household-start-icon">
        <HouseholdClayIcon name={create ? 'house' : 'invite'} />
      </span>
      <span className="household-start-choice-copy">
        <span className="household-choice-title">
          <strong>{create ? 'Tạo nhà mới' : 'Tôi có mã mời'}</strong>
          {create && <b>Mới</b>}
        </span>
        <span>
          {create ? 'Bắt đầu ghi sổ sức khỏe cho cả nhà.' : 'Nhập mã mời từ người thân để vào nhà.'}
        </span>
      </span>
      <span className="household-start-chevron">
        <Arrow3d size={40} />
      </span>
    </>
  );
  return (
    <Link
      to="/waiting"
      search={{ step: create ? 'create' : 'join' }}
      className={`household-start-choice${create ? ' household-start-choice-primary' : ''}`}
    >
      {content}
    </Link>
  );
}
