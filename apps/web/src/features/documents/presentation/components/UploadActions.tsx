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
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row">
      <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#aef0da] text-[#004135]">
          <DocumentIcon name="shield" />
        </span>
        <div>
          <p className="text-xs leading-4 font-semibold text-[#131d1d]">
            {sending ? 'Đang gửi ảnh' : 'Ảnh được che và nén trên máy rồi gửi cùng một lô'}
          </p>
          <p className="mt-0.5 text-xs leading-4 text-[#404945]" aria-live="polite">
            {hint}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
        <Link
          to="/"
          className="flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-6 text-xs font-semibold text-[#404945] transition-colors hover:bg-[#e4f0f0] hover:text-[#131d1d]"
        >
          Hủy bỏ
        </Link>
        <button
          type="button"
          disabled={sending || unredacted > 0 || summary.ready === 0 || !profileChosen}
          onClick={onSubmit}
          className="flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#004135] px-6 text-xs font-semibold text-white shadow-sm transition-colors enabled:hover:bg-[#20594b] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
        >
          {label} <DocumentIcon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
