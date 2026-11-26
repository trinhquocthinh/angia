import { Link } from '@tanstack/react-router';

export function TodayHomeLink() {
  return (
    <Link
      to="/"
      search={{}}
      className="mb-4 inline-flex min-h-btn items-center rounded-2xl border border-border bg-surface px-4 text-button-secondary font-semibold text-text-primary shadow-2xs transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
    >
      Hôm nay
    </Link>
  );
}
