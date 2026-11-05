import type { HealthProfile } from '@src/features/profiles/application/ports';
import { PrescriptionChainLink } from '@src/features/prescriptions/presentation/PrescriptionChainLink';

export function DocumentsHeading({ profile }: { profile: HealthProfile }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-white px-5 py-4 shadow-sm">
      <h2 className="text-lg font-semibold text-[#004135]">Hồ sơ & Giấy tờ khám</h2>
      {profile.consentStatus === 'confirmed' && <PrescriptionChainLink profileId={profile.id} />}
    </div>
  );
}
