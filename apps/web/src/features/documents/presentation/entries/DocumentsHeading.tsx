import type { HealthProfile } from '@src/features/profiles/application/ports';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { PrescriptionChainLink } from '@src/features/prescriptions/presentation/PrescriptionChainLink';

export function DocumentsHeading({ profile }: { profile: HealthProfile }) {
  return (
    <div className="doc-bento-card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="doc-clay-tile" aria-hidden="true">
          <ProfileSectionIcon name="folder_open" size={30} />
        </span>
        <h2 className="auth-heading text-heading-2 font-semibold text-accent">Hồ sơ & Giấy tờ khám</h2>
      </div>
      {profile.consentStatus === 'confirmed' && <PrescriptionChainLink profileId={profile.id} />}
    </div>
  );
}
