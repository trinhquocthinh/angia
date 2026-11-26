import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { ReviewItemState } from '../../application/reviewQueuePolling';
import { ReviewItemChip } from './ReviewItemChip';

type ReviewDetailHeadingProps = {
  profileName: string;
  state: ReviewItemState;
  position?: { index: number; total: number } | null;
};

// Đầu mục chi tiết theo Stitch 6f8ab883 (mobile: nút quay lại tròn + avatar + 1/3) và bb3e9ab1 (desktop).
export function ReviewDetailHeading({ profileName, state, position = null }: ReviewDetailHeadingProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/review"
          aria-label="Quay lại Chờ duyệt"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-accent shadow-stitch-sm transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none lg:hidden"
        >
          <AdminIcon name="arrow_back" size={22} />
        </Link>
        <span className="doc-ceramic-avatar" aria-hidden="true">
          {profileName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h2 className="auth-heading break-words text-heading-2 font-semibold tracking-tight text-accent">
            Giấy tờ của {profileName}
          </h2>
          <p className="text-caption text-text-secondary">Đối chiếu ảnh đã che trước khi lưu</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {position && (
          <span className="rounded-full bg-secondary-container px-3 py-1 text-caption font-bold text-on-secondary-container tabular-nums lg:hidden">
            {position.index} / {position.total}
          </span>
        )}
        <ReviewItemChip state={state} />
      </div>
    </div>
  );
}
