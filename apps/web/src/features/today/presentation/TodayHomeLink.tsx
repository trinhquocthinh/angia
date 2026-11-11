import { Link } from '@tanstack/react-router';

export function TodayHomeLink() {
  return (
    <Link
      to="/"
      search={{}}
      className="mb-4 inline-flex min-h-12 items-center rounded-xl border border-border px-4 text-lg font-semibold focus-visible:outline-3 focus-visible:outline-focus"
    >
      Hôm nay
    </Link>
  );
}
