// F09a: tải trang kế theo cursor (hàng đợi chứng từ, bảng số đo).
export function MoreButton({ loading, load }: { loading: boolean; load: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={load}
      className="min-h-11 rounded-xl bg-[#eaf6f5] px-4 text-sm font-semibold text-[#004135] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
    >
      {loading ? 'Đang tải…' : 'Xem thêm'}
    </button>
  );
}
