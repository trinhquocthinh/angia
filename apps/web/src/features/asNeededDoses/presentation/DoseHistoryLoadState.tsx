type Props = { loading: boolean; error: boolean; retry: () => void };
export function DoseHistoryLoadState({ loading, error, retry }: Props) {
  if (loading) return <p role="status">Đang tải nhật ký liều…</p>;
  if (!error) return null;
  return (
    <div role="alert" className="text-sm">
      <p>Không tải được nhật ký liều.</p>
      <button type="button" onClick={retry} className="min-h-11 font-semibold text-[#004135]">
        Thử lại
      </button>
    </div>
  );
}
