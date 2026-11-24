import type { OwnProfileDisposition } from '../../application/householdHomePorts';
import './household-leave.css';

type Props = {
  disposition: OwnProfileDisposition | null;
  pending: boolean;
  onChange: (value: OwnProfileDisposition) => void;
  name?: string;
};

export function LeaveDispositionOptions({
  disposition,
  pending,
  onChange,
  name = 'leave-profile-disposition',
}: Props) {
  return (
    <div
      className="household-leave-options"
      role="radiogroup"
      aria-label="Chọn phương án xử lý hồ sơ cá nhân"
    >
      <span className="household-leave-options-label">Chọn phương án xử lý hồ sơ cá nhân:</span>
      <label
        className={`household-leave-radio-card${disposition === 'keep' ? ' household-leave-radio-card-active' : ''}`}
      >
        <input
          type="radio"
          name={name}
          value="keep"
          checked={disposition === 'keep'}
          disabled={pending}
          onChange={() => onChange('keep')}
        />
        <span className="household-leave-radio-copy">
          <strong>Để lại hồ sơ cho nhà</strong>
          <span>Hồ sơ của bạn ở lại nhà, gỡ liên kết với tài khoản.</span>
        </span>
      </label>
      <label
        className={`household-leave-radio-card${disposition === 'delete' ? ' household-leave-radio-card-danger' : ''}`}
      >
        <input
          type="radio"
          name={name}
          value="delete"
          checked={disposition === 'delete'}
          disabled={pending}
          onChange={() => onChange('delete')}
        />
        <span className="household-leave-radio-copy">
          <strong className="household-leave-radio-danger-title">Xoá hồ sơ của tôi</strong>
          <span>Hồ sơ và ảnh bị xoá hẳn, không khôi phục được.</span>
        </span>
      </label>
    </div>
  );
}
