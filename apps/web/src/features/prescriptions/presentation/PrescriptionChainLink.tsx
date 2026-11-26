import { Link } from '@tanstack/react-router';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

export function PrescriptionChainLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/prescriptions"
      params={{ profileId }}
      className="inline-flex min-h-btn items-center gap-2 self-start rounded-2xl border border-border/45 bg-bg px-4 text-button-secondary font-semibold text-accent shadow-stitch-sm transition-colors hover:bg-accent-soft"
    >
      <ProfileSectionIcon name="receipt_long" size={22} />
      <span>Chuỗi đơn thuốc</span>
    </Link>
  );
}
