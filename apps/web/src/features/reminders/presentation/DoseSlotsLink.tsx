import { Link } from '@tanstack/react-router';

// Lối vào cấu hình nhắc thuốc (khung giờ, người nhận) từ tab Thuốc điều trị (Design §5 route /profiles/:id/reminders).
export function DoseSlotsLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/reminders"
      params={{ profileId }}
      className="inline-flex min-h-btn items-center rounded-2xl border border-border/45 bg-surface px-4 text-button-secondary font-semibold text-text-primary shadow-stitch-sm transition-colors hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      Nhắc thuốc
    </Link>
  );
}
