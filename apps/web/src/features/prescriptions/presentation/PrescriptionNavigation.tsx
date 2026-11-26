import { Link } from '@tanstack/react-router';

type Props = { profileId: string; previousId: string | null; nextId: string | null };
export function PrescriptionNavigation({ profileId, previousId, nextId }: Props) {
  if (!previousId && !nextId) return null;
  return (
    <nav aria-label="Điều hướng chuỗi đơn" className="flex flex-wrap items-center justify-between gap-3">
      {previousId ? (
        <Link
          to="/profiles/$profileId/prescriptions/$prescriptionId"
          params={{ profileId, prescriptionId: previousId }}
          className="inline-flex min-h-btn items-center gap-1.5 rounded-full border border-border/45 bg-surface px-5 text-button-secondary font-semibold text-accent shadow-stitch-sm transition-colors hover:bg-accent-soft"
        >
          <span aria-hidden="true">‹</span>
          <span>Đơn trước</span>
        </Link>
      ) : (
        <span />
      )}
      {nextId && (
        <Link
          to="/profiles/$profileId/prescriptions/$prescriptionId"
          params={{ profileId, prescriptionId: nextId }}
          className="inline-flex min-h-btn items-center gap-1.5 rounded-full border border-border/45 bg-surface px-5 text-button-secondary font-semibold text-accent shadow-stitch-sm transition-colors hover:bg-accent-soft"
        >
          <span>Đơn sau</span>
          <span aria-hidden="true">›</span>
        </Link>
      )}
    </nav>
  );
}
