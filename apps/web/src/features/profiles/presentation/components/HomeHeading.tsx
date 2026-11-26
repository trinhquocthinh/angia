import { TodayHomeLink } from '@src/features/today/presentation/TodayHomeLink';
import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Đầu trang Hồ sơ gia đình theo chuẩn 3D Bento v2.0: gọn chữ, ưu tiên nhãn chip và nút chính.
export function HomeHeading({
  familyName,
  subtitle,
  canCreate,
}: {
  familyName: string | undefined;
  subtitle: string;
  canCreate: boolean;
}) {
  return (
    <section className="flex flex-col gap-4 pb-2 lg:mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <TodayHomeLink />
        {familyName && (
          <span className="mb-4 inline-flex min-h-btn items-center gap-1.5 rounded-full bg-accent-soft px-3.5 text-caption font-semibold text-accent">
            <AdminIcon name="home_health" size={16} />
            <span className="truncate">{familyName}</span>
          </span>
        )}
      </div>
      <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center lg:gap-6">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2.5">
          <h1 className="auth-heading break-words text-heading-1 font-semibold tracking-tight text-accent">
            Hồ sơ gia đình
          </h1>
          <span className="rounded-full bg-surface-container px-3 py-1 text-caption font-semibold text-text-secondary">
            {subtitle}
          </span>
        </div>
        {canCreate && (
          <Link
            to="/profiles/new"
            className="inline-flex min-h-btn shrink-0 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-sm transition-all duration-200 hover:bg-accent-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus lg:px-6"
          >
            <AdminIcon name="person_add" size={20} />
            Thêm hồ sơ
          </Link>
        )}
      </div>
    </section>
  );
}
