import type { PrivacyEditorAction } from '../../application/privacyEditorState';
type Props = {
  disabled: boolean;
  count: number;
  index: number;
  setSelected: (index: number) => void;
  dispatch: (action: PrivacyEditorAction) => void;
};
export function PrivacyRegionSelector({ disabled, count, index, setSelected, dispatch }: Props) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm text-[#004135]">
        <span className="flex items-center justify-between gap-2 font-semibold">
          Vùng cần chỉnh<span className="text-[11px] font-medium text-[#286958]">{count}/32 vùng che</span>
        </span>
        <select
          aria-label="Vùng cần chỉnh"
          disabled={disabled}
          value={index}
          onChange={(event) => setSelected(Number(event.target.value))}
          className="min-h-11 rounded-xl border-0 bg-[#eaf6f5] px-3 text-sm"
        >
          <option value={-1}>Vùng cắt</option>
          {Array.from({ length: count }, (_, n) => (
            <option key={n} value={n}>
              Vùng che {n + 1}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between gap-2 text-xs text-[#55615f]">
        {index >= 0 && (
          <button
            type="button"
            disabled={disabled}
            className="ml-auto min-h-11 rounded-lg px-2 text-xs font-medium text-[#ba1a1a] disabled:opacity-40"
            onClick={() => {
              dispatch({ type: 'remove-mask', index });
              setSelected(-1);
            }}
          >
            Bỏ vùng che {index + 1}
          </button>
        )}
      </div>
    </>
  );
}
