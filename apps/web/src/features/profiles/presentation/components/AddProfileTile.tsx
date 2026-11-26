import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

export function AddProfileTile() {
  return (
    <Link
      to="/profiles/new"
      className="group flex min-h-44 flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-border/70 bg-accent-soft/60 p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface hover:shadow-md active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-accent shadow-xs transition-colors group-hover:bg-accent group-hover:text-on-accent"
      >
        <AdminIcon name="person_add" size={28} />
      </span>
      <span className="text-heading-2 font-semibold text-accent">Thêm hồ sơ mới</span>
    </Link>
  );
}
