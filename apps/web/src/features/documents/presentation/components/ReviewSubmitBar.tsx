// Thanh "Lưu vào sổ": dính ngay trên thanh điều hướng đáy trên di động, nằm cuối form trên desktop (Enter cũng lưu).
export function ReviewSubmitBar({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 flex flex-col gap-2 bg-[#f0fcfb]/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:p-0">
      <button
        type="submit"
        disabled={pending || disabled}
        className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
      >
        {pending ? 'Đang lưu…' : 'Lưu vào sổ'}
      </button>
      <p className="hidden text-center text-xs text-[#55615f] lg:block">Nhấn Enter để lưu</p>
    </div>
  );
}
