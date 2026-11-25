import { Link } from '@tanstack/react-router';

export function PrescriptionChainLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/prescriptions"
      params={{ profileId }}
      className="inline-flex min-h-12 items-center self-start rounded-full border border-border bg-surface px-5 text-button-secondary font-semibold text-accent"
    >
      Chuỗi đơn thuốc
    </Link>
  );
}
