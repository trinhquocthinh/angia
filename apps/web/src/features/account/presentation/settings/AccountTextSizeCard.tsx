import { useContext, useId } from 'react';
import { TextSizeContext } from '@src/shared/accessibility/TextSizeContext';
import './account-text-size.css';

export function AccountTextSizeCard() {
  const context = useContext(TextSizeContext);
  const hintId = useId();
  if (!context) throw new Error('AccountTextSizeCard cần TextSizeProvider');
  return (
    <section className="account-card" aria-labelledby={`${hintId}-heading`}>
      <h2 id={`${hintId}-heading`} className="account-card-title">
        Cỡ chữ
      </h2>
      <div className="account-text-size-row">
        <div>
          <label htmlFor={`${hintId}-switch`} className="text-body font-semibold">
            Chữ lớn
          </label>
          <p id={hintId} className="text-caption text-text-secondary">
            Tăng cỡ chữ trên mọi màn hình để dễ đọc hơn. Lựa chọn được lưu trên thiết bị này.
          </p>
        </div>
        <button
          id={`${hintId}-switch`}
          type="button"
          role="switch"
          aria-label="Chữ lớn"
          aria-checked={context.largeText}
          aria-describedby={hintId}
          className="account-text-size-switch"
          onClick={() => context.setLargeText(!context.largeText)}
        >
          <span aria-hidden="true">{context.largeText ? 'Bật' : 'Tắt'}</span>
          <span className="account-text-size-thumb" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
