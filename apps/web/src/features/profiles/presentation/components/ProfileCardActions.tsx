import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

const textAction =
  'inline-flex min-h-btn shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-button-secondary font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus';

// Chân thẻ hồ sơ: nút xem chi tiết dạng pill Bento v2.0; nút xóa luôn ở cuối DOM (SPEC-007, TC-382).
export function ProfileCardActions({
  profileId,
  onDelete,
  onWithdraw,
}: {
  profileId: string;
  onDelete: () => void;
  onWithdraw?: (() => void) | undefined;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2.5 border-t border-border/35 pt-3.5 lg:mt-auto lg:pt-4">
      <Link
        to="/profiles/$profileId"
        params={{ profileId }}
        className="flex min-h-btn items-center justify-center gap-2 rounded-2xl bg-accent-soft px-4 text-button-primary font-semibold text-accent transition-colors hover:bg-accent hover:text-on-accent active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
      >
        Xem hồ sơ chi tiết
        <AdminIcon name="arrow_outward" size={18} />
      </Link>
      <div className={`flex flex-wrap items-center gap-2 ${onWithdraw ? 'justify-between' : 'justify-end'}`}>
        {onWithdraw && (
          <button
            type="button"
            className={`${textAction} bg-surface-container text-text-secondary hover:bg-accent-soft hover:text-accent`}
            onClick={onWithdraw}
          >
            <AdminIcon name="shield" size={17} />
            Rút đồng thuận
          </button>
        )}
        <button
          type="button"
          className={`${textAction} bg-danger-soft/60 text-danger hover:bg-danger-soft`}
          onClick={onDelete}
        >
          <AdminIcon name="delete_outline" size={17} />
          Xóa hồ sơ
        </button>
      </div>
    </div>
  );
}
