type Props = {
  scanned: boolean;
  disabled: boolean;
  hasMasks: boolean;
  onScan: () => void;
  onUnscan: () => void;
};

const button =
  'flex min-h-11 items-center gap-1.5 rounded-xl bg-[#e4f0f0] px-3 text-xs font-semibold text-[#131d1d] transition-colors enabled:hover:bg-[#deebea] disabled:opacity-40';

// SPEC-084 P1/P5: "Nắn giấy" là tuỳ chọn trong trình che; đã nắn thì cho quay về ảnh gốc (đặt lại vùng che).
export function ScanTools({ scanned, disabled, hasMasks, onScan, onUnscan }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scanned ? (
        <button
          type="button"
          className={button}
          disabled={disabled}
          onClick={() => {
            if (
              !hasMasks ||
              window.confirm('Dùng lại ảnh gốc sẽ xoá vùng cắt và vùng che hiện có. Tiếp tục?')
            )
              onUnscan();
          }}
        >
          Dùng lại ảnh gốc
        </button>
      ) : (
        <button type="button" className={button} disabled={disabled} onClick={onScan}>
          Nắn giấy
        </button>
      )}
      <span className="text-[12px] text-[#404945]">
        {scanned
          ? 'Đang dùng ảnh đã nắn. Ảnh vẫn chỉ nằm trên máy của bạn.'
          : 'Ảnh chụp giấy trên bàn? Nắn 4 góc cho thẳng trước khi che.'}
      </span>
    </div>
  );
}
