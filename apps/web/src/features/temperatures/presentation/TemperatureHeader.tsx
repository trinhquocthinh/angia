type Props = { editable: boolean; pending: boolean; onRecord: () => void };

export function TemperatureHeader({ editable, pending, onRecord }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-accent">Nhiệt độ</h2>
      {editable && (
        <button
          type="button"
          disabled={pending}
          onClick={onRecord}
          className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-50"
        >
          Ghi nhiệt độ
        </button>
      )}
    </div>
  );
}
