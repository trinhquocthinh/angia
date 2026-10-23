import { Link } from '@tanstack/react-router';

// Lối vào cấu hình khung giờ nhắc từ tab Thuốc điều trị (Design §5 route /profiles/:id/reminders).
export function DoseSlotsLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/reminders"
      params={{ profileId }}
      className="flex min-h-11 items-center rounded-xl bg-[#e4f0f0] px-4 text-sm font-semibold text-[#404945] transition-colors hover:bg-[#deebea] hover:text-[#131d1d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
    >
      Khung giờ nhắc
    </Link>
  );
}
