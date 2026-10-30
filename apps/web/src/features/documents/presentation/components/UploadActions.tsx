import { Link } from '@tanstack/react-router';
import { DocumentIcon } from './DocumentIcon';

type UploadActionsProps = {
  summary: { needsRedaction: number; ready: number; total: number; done: number; active: number };
  profileChosen: boolean;
  onSubmit: () => void;
};

type Summary = UploadActionsProps['summary'];

const submitLabel = ({ active, done, total, ready }: Summary) =>
  active > 0 ? (
    `Đang gửi ${done}/${total}`
  ) : ready > 0 ? (
    <>
      Xong — gửi {ready} ảnh<span className="max-sm:hidden">, đến Chờ duyệt</span>
    </>
  ) : (
    'Xong — gửi ảnh'
  );

function actionHint({ active, needsRedaction, ready, total }: Summary, profileChosen: boolean) {
  if (active > 0) return 'Giữ trang này mở cho tới khi gửi xong.';
  if (needsRedaction > 0) return `Còn ${needsRedaction} ảnh chưa che. Che xong mọi ảnh rồi bấm Xong.`;
  if (ready > 0 && !profileChosen) return 'Chọn hồ sơ ở mục “Của ai?” trước khi gửi.';
  if (total === 0) return 'Chọn ảnh ở trên để bắt đầu. Ảnh chỉ được gửi khi bấm “Xong”.';
  return 'Ảnh chỉ được gửi khi bấm “Xong”; trước đó bạn có thể bỏ bớt ảnh.';
}

// Ảnh chỉ rời trình duyệt khi đã che hết và bấm "Xong" (tránh rác S3/DB khi người dùng chọn rồi bỏ).
export function UploadActions({ summary, profileChosen, onSubmit }: UploadActionsProps) {
  const sending = summary.active > 0;
  const unredacted = summary.needsRedaction;
  const label = submitLabel(summary);
  const hint = actionHint(summary, profileChosen);
  return (
    <div
      // Di động: có ảnh thì ghim thanh gửi ngay trên thanh điều hướng đáy, trong vùng ngón cái.
      className={`z-30 flex flex-col items-center justify-between gap-3 rounded-2xl bg-white/95 p-3 shadow-card backdrop-blur-md sm:flex-row sm:gap-4 sm:p-4 ${
        summary.total > 0 ? 'max-lg:sticky max-lg:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]' : ''
      }`}
    >
      <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#aef0da] text-[#004135] max-sm:hidden">
          <DocumentIcon name="shield" />
        </span>
        <div>
          <p className="text-[13px] leading-5 font-semibold text-[#131d1d] max-sm:hidden">
            {sending ? 'Đang gửi ảnh' : 'Ảnh được che và nén trên máy rồi gửi cùng một lô'}
          </p>
          <p
            className={`text-[13px] leading-5 ${unredacted > 0 ? 'text-[#833b00]' : 'text-[#404945]'}`}
            aria-live="polite"
          >
            {hint}
          </p>
        </div>
      </div>
      <div className="flex w-full items-stretch gap-2 sm:w-auto sm:shrink-0 sm:items-center">
        <Link
          to="/"
          className="flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-4 text-sm font-semibold text-[#404945] transition-colors sm:px-6 hover:bg-[#e4f0f0] hover:text-[#131d1d] motion-reduce:transition-none"
        >
          Hủy bỏ
        </Link>
        <button
          type="button"
          disabled={sending || unredacted > 0 || summary.ready === 0 || !profileChosen}
          onClick={onSubmit}
          className="group flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-[background-color,color,box-shadow,scale] duration-200 enabled:cursor-pointer enabled:bg-[#004135] enabled:text-white enabled:shadow-[0_4px_16px_rgba(0,65,53,0.25)] enabled:hover:bg-[#20594b] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#e4f0f0] disabled:text-[#55615f] motion-reduce:transition-none motion-reduce:enabled:active:scale-100 sm:flex-none sm:px-6"
        >
          {label}{' '}
          {sending ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-[#286958]/30 border-t-[#286958] motion-reduce:animate-none"
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
