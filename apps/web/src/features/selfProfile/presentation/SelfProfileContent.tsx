import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileIdentityHero } from '@src/features/profiles/presentation/components/ProfileIdentityHero';
import { resolveSelfSection, type SelfSectionKey } from '../application/selfSections';
import { useSelfProfile } from '../application/useSelfProfile';
import { selfProfileRepository as repository } from './selfProfileRepository';
import { SelfLoadError, SelfSkeleton } from './SelfLoadState';
import { SelfSection } from './SelfSection';
import { SelfTabs } from './SelfTabs';

const Notice = ({ text }: { text: string }) => (
  <p role="alert" className="profile-bento-card p-6 text-body">
    {text}
  </p>
);
const NOT_LINKED = 'Tài khoản chưa liên kết hồ sơ sức khỏe.';

type Props = { session: ProfileSession; section: SelfSectionKey | undefined; issueId?: string | undefined };

// Design §9.5: chỉ dựng nội dung sức khỏe khi hồ sơ đã đồng thuận; dùng chung Hero + Bento 3D với /profiles/:id.
export function SelfProfileContent({ session, section, issueId }: Props) {
  const summary = useSelfProfile(repository, session);
  if (!session.account.healthProfileId) return <Notice text={NOT_LINKED} />;
  if (summary.isError) {
    if (summary.error instanceof MedicationRequestError && summary.error.status === 404)
      return <Notice text={NOT_LINKED} />;
    return <SelfLoadError label="hồ sơ của bạn" retry={() => void summary.refetch()} />;
  }
  if (!summary.data) return <SelfSkeleton label="hồ sơ của bạn" />;
  const profile = summary.data;
  if (profile.id !== session.account.healthProfileId) return <Notice text={NOT_LINKED} />;
  const active = resolveSelfSection(section, profile.showsVitals);
  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-5">
      <ProfileIdentityHero
        title="Hồ sơ của tôi"
        displayName={profile.displayName}
        subtitle={profile.displayName}
        birthYear={profile.birthYear}
        consentStatus={profile.consentStatus}
      />
      {profile.consentStatus === 'confirmed' ? (
        <>
          <SelfTabs active={active} showsVitals={profile.showsVitals} />
          <SelfSection session={session} section={active} profile={profile} issueId={issueId} />
        </>
      ) : (
        <Notice text="Hồ sơ chưa được đồng ý lưu dữ liệu." />
      )}
    </div>
  );
}
