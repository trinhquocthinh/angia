import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Băng thông báo giấy tờ chờ duyệt theo chuẩn 3D Bento v2.0: icon 3D đất sét + thông tin gọn.
export function PendingReviewBanner({ count }: { count: number | undefined }) {
  if (!count) return null;
  return (
    <section className="mb-5 flex items-center justify-between gap-3 rounded-[22px] border border-border/35 bg-accent-soft px-4 py-3.5 shadow-xs lg:mb-8 lg:px-6 lg:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src="/images/profile-sections/documents-3d.png"
          alt=""
          width="44"
          height="44"
          className="profile-clay-icon h-11 w-11"
        />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-accent px-2 py-0.5 text-caption font-bold text-on-accent tabular-nums">
            {count}
          </span>
          <p className="truncate text-body font-semibold text-text-primary">giấy tờ chờ duyệt</p>
        </div>
      </div>
      <Link
        to="/review"
        className="inline-flex min-h-btn shrink-0 items-center gap-1.5 rounded-2xl bg-surface px-4 text-button-secondary font-semibold text-accent shadow-xs transition-colors hover:bg-choice-soft active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Duyệt ngay
        <AdminIcon name="arrow_forward" size={18} />
      </Link>
    </section>
  );
}
