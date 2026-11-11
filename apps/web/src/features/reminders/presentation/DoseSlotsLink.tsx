import { Link } from '@tanstack/react-router';

// Lối vào cấu hình nhắc thuốc (khung giờ, người nhận) từ tab Thuốc điều trị (Design §5 route /profiles/:id/reminders).
export function DoseSlotsLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/reminders"
      params={{ profileId }}
      className="flex min-h-11 items-center rounded-xl bg-accent-soft px-4 text-sm font-semibold text-text-secondary transition-colors hover:bg-border hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      Nhắc thuốc
    </Link>
  );
}
