import { Link } from '@tanstack/react-router';

type Props = { profileId: string; previousId: string | null; nextId: string | null };
export function PrescriptionNavigation({ profileId, previousId, nextId }: Props) {
  return (
    <nav aria-label="Điều hướng chuỗi đơn" className="flex flex-wrap justify-between gap-3">
      {[
        { id: previousId, label: 'Đơn trước' },
        { id: nextId, label: 'Đơn sau' },
      ].map(
        ({ id, label }) =>
          id && (
            <Link
              key={label}
              to="/profiles/$profileId/prescriptions/$prescriptionId"
              params={{ profileId, prescriptionId: id }}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-accent"
            >
              {label}
            </Link>
          ),
      )}
    </nav>
  );
}
