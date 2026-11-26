import { Link } from '@tanstack/react-router';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { usePrescriptionChain } from '../application/usePrescriptionChain';
import { createPrescriptionRepository } from '../infrastructure/createPrescriptionRepository';
import { PrescriptionChain } from './PrescriptionChain';
import { PrescriptionDetailContent } from './PrescriptionDetailContent';
import { PrescriptionLoadState } from './PrescriptionLoadState';

const repository = createPrescriptionRepository();
type Props = { profile: ProfileListItem; session: ProfileSession; prescriptionId?: string | undefined };
export function PrescriptionsContent({ profile, session, prescriptionId }: Props) {
  const chain = usePrescriptionChain(repository, session, profile);
  const retry = () => {
    void chain.refetch();
  };
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProfileHealthHeader profile={profile} session={session} active="documents" />
      <section className="profile-bento-card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
            <ProfileSectionIcon name="receipt_long" size={38} />
          </span>
          <div className="min-w-0">
            <h2 className="auth-heading text-heading-2 font-semibold text-accent">Chuỗi đơn thuốc</h2>
            <p className="mt-0.5 text-caption text-text-secondary">
              Các đơn đã lưu theo thứ tự ngày kê, từ trước đến sau.
            </p>
          </div>
        </div>
        <Link
          to={prescriptionId ? '/profiles/$profileId/prescriptions' : '/profiles/$profileId/documents'}
          params={{ profileId: profile.id }}
          className="inline-flex min-h-btn items-center gap-1.5 rounded-full border border-border/45 bg-bg px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-accent-soft"
        >
          <span aria-hidden="true">←</span>
          <span>{prescriptionId ? 'Về chuỗi đơn thuốc' : 'Về Hồ sơ & Giấy tờ khám'}</span>
        </Link>
      </section>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="profile-bento-card p-6 text-body">
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
