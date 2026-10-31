import { Link } from '@tanstack/react-router';
import { DocumentIcon } from './DocumentIcon';

type UploadActionsProps = {
  summary: { needsRedaction: number; ready: number; total: number; done: number; active: number };
  profileChosen: boolean;
  onSubmit: () => void;
};

// Ảnh chỉ rời trình duyệt khi đã che hết và bấm "Xong" (tránh rác S3/DB khi người dùng chọn rồi bỏ).
export function UploadActions({ summary, profileChosen, onSubmit }: UploadActionsProps) {
  const sending = summary.active > 0;
  const unredacted = summary.needsRedaction;
  const label = sending
    ? `Đang gửi ${summary.done}/${summary.total}`
    : summary.ready > 0
      ? `Xong — gửi ${summary.ready} ảnh, đến Chờ duyệt`
      : 'Xong — gửi ảnh';
  const hint = sending
    ? 'Giữ trang này mở cho tới khi gửi xong.'
    : unredacted > 0
      ? `Còn ${unredacted} ảnh chưa che. Che xong mọi ảnh rồi bấm Xong.`
      : summary.ready > 0 && !profileChosen
        ? 'Chọn hồ sơ ở mục “Của ai?” trước khi gửi.'
        : 'Ảnh chỉ được gửi khi bấm “Xong”; trước đó bạn có thể bỏ bớt ảnh.';
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row">
      <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#aef0da] text-[#004135]">
          <DocumentIcon name="shield" />
        </span>
        <div>
          <p className="text-[13px] leading-5 font-semibold text-[#131d1d]">
            {sending ? 'Đang gửi ảnh' : 'Ảnh được che và nén trên máy rồi gửi cùng một lô'}
          </p>
          <p className="text-[13px] leading-5 text-[#404945]" aria-live="polite">
            {hint}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
        <Link
          to="/"
          className="flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-6 text-sm font-semibold text-[#404945] transition-colors hover:bg-[#e4f0f0] hover:text-[#131d1d] motion-reduce:transition-none"
        >
          Hủy bỏ
        </Link>
        <button
          type="button"
          disabled={sending || unredacted > 0 || summary.ready === 0 || !profileChosen}
          onClick={onSubmit}
          className="group flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#004135] px-6 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,opacity,scale] duration-200 enabled:hover:bg-[#20594b] enabled:hover:shadow-md enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none motion-reduce:enabled:active:scale-100 sm:w-auto"
        >
          {label}{' '}
          {sending ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
            />
          ) : (
            <span className="transition-[translate] duration-200 ease-out group-enabled:group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-enabled:group-hover:translate-x-0">
              <DocumentIcon name="arrow" size={18} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
