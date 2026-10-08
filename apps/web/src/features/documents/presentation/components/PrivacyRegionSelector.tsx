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
        Vùng cần chỉnh
        <select
          aria-label="Vùng cần chỉnh"
          disabled={disabled}
          value={index}
          onChange={(event) => setSelected(Number(event.target.value))}
          className="min-h-11 rounded-lg border border-[#d6e5df] bg-white px-2"
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
        <span>{count}/32 vùng che</span>
        {index >= 0 && (
          <button
            type="button"
            disabled={disabled}
            className="min-h-11 rounded-xl border border-[#d6e5df] bg-white px-3 text-sm font-medium text-[#004135] disabled:opacity-40"
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
