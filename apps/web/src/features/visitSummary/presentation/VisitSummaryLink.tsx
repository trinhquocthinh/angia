import { Link } from '@tanstack/react-router';
import { PrinterIcon } from './PrinterIcon';

// Lối vào bản tóm tắt đi khám từ đầu trang hồ sơ theo nút phụ Bento v2.0.
export function VisitSummaryLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/summary"
      params={{ profileId }}
      className="inline-flex min-h-btn shrink-0 items-center gap-2 rounded-2xl bg-accent-soft px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-choice-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <PrinterIcon size={18} />
      Tóm tắt đi khám
    </Link>
  );
}
