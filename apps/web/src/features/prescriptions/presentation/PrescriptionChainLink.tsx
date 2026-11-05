import { Link } from '@tanstack/react-router';

export function PrescriptionChainLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/prescriptions"
      params={{ profileId }}
      className="inline-flex min-h-11 items-center self-start rounded-full border border-[#bfcfc7] bg-white px-5 text-sm font-semibold text-[#004135]"
    >
      Chuỗi đơn thuốc
    </Link>
  );
}
