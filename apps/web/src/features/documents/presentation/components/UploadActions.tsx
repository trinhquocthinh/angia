import { Link } from '@tanstack/react-router';
import { DocumentIcon } from './DocumentIcon';

type UploadActionsProps = {
  summary: { ready: number; total: number; done: number; active: number };
  profileChosen: boolean;
  onSubmit: () => void;
};

// Ảnh chỉ rời trình duyệt khi bấm "Xong" (tránh rác S3/DB khi người dùng chọn rồi bỏ).
export function UploadActions({ summary, profileChosen, onSubmit }: UploadActionsProps) {
  const sending = summary.active > 0;
  const label = sending
    ? `Đang gửi ${summary.done}/${summary.total}`
    : summary.ready > 0
      ? `Xong — gửi ${summary.ready} ảnh, đến Chờ duyệt`
      : 'Xong — gửi ảnh';
  const hint = sending
    ? 'Giữ trang này mở cho tới khi gửi xong.'
    : summary.ready > 0 && !profileChosen
      ? 'Chọn hồ sơ ở mục “Của ai?” trước khi gửi.'
      : 'Ảnh chỉ được gửi khi bấm “Xong”; trước đó bạn có thể bỏ bớt ảnh.';
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-md sm:flex-row">
      <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#aef0da] text-[#002019]">
          <DocumentIcon name="upload" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#131d1d]">
            {sending ? 'Đang gửi ảnh lần lượt' : 'Ảnh được gửi lần lượt từng tấm'}
          </p>
          <p className="text-[11px] font-medium text-[#286958]" aria-live="polite">
            {hint}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
        <Link
          to="/"
          className="flex h-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-6 text-sm font-semibold text-[#404945] hover:bg-[#e4f0f0]"
        >
          Hủy bỏ
        </Link>
        <button
          type="button"
          disabled={sending || summary.ready === 0 || !profileChosen}
          onClick={onSubmit}
          className="flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#004135] px-8 text-sm font-bold text-white shadow-md enabled:hover:bg-[#20594b] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
        >
          {label} <DocumentIcon name="arrow" />
        </button>
      </div>
    </div>
  );
}
