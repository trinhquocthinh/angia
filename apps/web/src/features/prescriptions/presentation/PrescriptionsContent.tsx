import { Link } from '@tanstack/react-router';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { usePrescriptionChain } from '../application/usePrescriptionChain';
import { createPrescriptionRepository } from '../infrastructure/createPrescriptionRepository';
import { PrescriptionChain } from './PrescriptionChain';
import { PrescriptionDetailContent } from './PrescriptionDetailContent';
import { PrescriptionLoadState } from './PrescriptionLoadState';

const repository = createPrescriptionRepository();
type Props = { profile: HealthProfile; session: ProfileSession; prescriptionId?: string | undefined };
export function PrescriptionsContent({ profile, session, prescriptionId }: Props) {
  const chain = usePrescriptionChain(repository, session, profile);
  const retry = () => {
    void chain.refetch();
  };
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProfileHealthHeader profile={profile} session={session} active="documents" />
      <div className="rounded-[20px] bg-white p-5">
        <Link
          to={prescriptionId ? '/profiles/$profileId/prescriptions' : '/profiles/$profileId/documents'}
          params={{ profileId: profile.id }}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#004135] underline underline-offset-4"
        >
          {prescriptionId ? 'Về chuỗi đơn thuốc' : 'Về Hồ sơ & Giấy tờ khám'}
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-[#004135]">Chuỗi đơn thuốc</h2>
        <p className="mt-2 text-sm text-[#55615f]">Các đơn đã lưu theo thứ tự ngày kê, từ trước đến sau.</p>
      </div>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : chain.data ? (
        prescriptionId ? (
          <PrescriptionDetailContent
            key={prescriptionId}
            profile={profile}
            session={session}
            prescriptionId={prescriptionId}
            chain={chain.data}
            refreshChain={retry}
          />
        ) : (
          <PrescriptionChain data={chain.data} profileId={profile.id} />
        )
      ) : (
        <PrescriptionLoadState error={chain.error} retry={retry} />
      )}
    </div>
  );
}
