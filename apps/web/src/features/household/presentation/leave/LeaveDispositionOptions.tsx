import type { OwnProfileDisposition } from '../../application/householdHomePorts';

type Props = {
  disposition: OwnProfileDisposition;
  pending: boolean;
  onChange: (value: OwnProfileDisposition) => void;
};

export function LeaveDispositionOptions({ disposition, pending, onChange }: Props) {
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
          name="leave-profile-disposition"
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
          name="leave-profile-disposition"
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
