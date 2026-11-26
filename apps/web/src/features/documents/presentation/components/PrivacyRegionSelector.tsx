import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
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
      <label className="flex flex-col gap-1.5 text-caption text-accent">
        <span className="flex items-center justify-between gap-2 font-semibold">
          Vùng cần chỉnh
          <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-caption font-semibold text-on-secondary-container tabular-nums">
            {count}/32 vùng che
          </span>
        </span>
        <select
          aria-label="Vùng cần chỉnh"
          disabled={disabled}
          value={index}
          onChange={(event) => setSelected(Number(event.target.value))}
          className="min-h-12 rounded-xl border border-border/50 bg-bg px-3 text-body text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <option value={-1}>Vùng cắt</option>
          {Array.from({ length: count }, (_, n) => (
            <option key={n} value={n}>
              Vùng che {n + 1}
            </option>
          ))}
        </select>
      </label>
      {index >= 0 && (
        <button
          type="button"
          disabled={disabled}
          className="inline-flex min-h-btn w-full items-center justify-center gap-1.5 rounded-xl border border-danger/25 bg-danger-soft/45 px-3 text-button-secondary font-semibold text-danger transition-colors enabled:hover:bg-danger-soft disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          onClick={() => {
            dispatch({ type: 'remove-mask', index });
            setSelected(-1);
          }}
        >
          <AdminIcon name="delete_outline" size={18} />
          Bỏ vùng che {index + 1}
        </button>
      )}
    </>
  );
}
