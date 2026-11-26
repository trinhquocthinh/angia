import { PrivacyToolIcon } from './PrivacyToolIcon';

type Props = {
  scanned: boolean;
  disabled: boolean;
  hasMasks: boolean;
  onScan: () => void;
  onUnscan: () => void;
};

// SPEC-084 P1/P5: "Nắn giấy" là tuỳ chọn trong trình che; đã nắn thì cho quay về ảnh gốc (đặt lại vùng che).
export function ScanTools({ scanned, disabled, hasMasks, onScan, onUnscan }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/35 bg-bg p-3">
      {scanned ? (
        <button
          type="button"
          className="privacy-tool-btn"
          disabled={disabled}
          onClick={() => {
            if (
              !hasMasks ||
              window.confirm('Dùng lại ảnh gốc sẽ xoá vùng cắt và vùng che hiện có. Tiếp tục?')
            )
              onUnscan();
          }}
        >
          <PrivacyToolIcon name="undo" />
          Dùng lại ảnh gốc
        </button>
      ) : (
        <button type="button" className="privacy-tool-btn" disabled={disabled} onClick={onScan}>
          <PrivacyToolIcon name="crop" />
          Nắn giấy
        </button>
      )}
      <span className="min-w-0 flex-1 text-caption text-text-secondary">
        {scanned
          ? 'Đang dùng ảnh đã nắn. Ảnh vẫn chỉ nằm trên máy của bạn.'
          : 'Ảnh chụp giấy trên bàn? Nắn 4 góc cho thẳng trước khi che.'}
      </span>
    </div>
  );
}
