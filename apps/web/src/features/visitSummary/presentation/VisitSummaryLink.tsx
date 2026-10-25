import { Link } from '@tanstack/react-router';
import { PrinterIcon } from './PrinterIcon';

// Lối vào bản tóm tắt đi khám từ đầu trang hồ sơ (Design v0.1 AGProfileHeader).
export function VisitSummaryLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/summary"
      params={{ profileId }}
      className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#bfc9c4] bg-white px-4 text-sm font-semibold text-[#004135] hover:bg-[#e3efea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
    >
      <PrinterIcon size={18} />
      Tóm tắt đi khám
    </Link>
  );
}
