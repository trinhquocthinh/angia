import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { resolveSelfSection, type SelfSectionKey } from '../application/selfSections';
import { useSelfProfile } from '../application/useSelfProfile';
import { selfProfileRepository } from './selfProfileRepository';
import { SelfLoadError, SelfSkeleton } from './SelfLoadState';
import { SelfSection } from './SelfSection';
import { SelfTabs } from './SelfTabs';

const Notice = ({ text }: { text: string }) => (
  <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
    {text}
  </p>
);
const NOT_LINKED = 'Tài khoản chưa liên kết hồ sơ sức khỏe.';

type Props = { session: ProfileSession; section: SelfSectionKey | undefined };

// Design §9.5: chỉ dựng nội dung sức khỏe khi hồ sơ đã đồng thuận; mọi mục đều chỉ đọc.
export function SelfProfileContent({ session, section }: Props) {
  const summary = useSelfProfile(selfProfileRepository, session);
  if (!session.account.healthProfileId) return <Notice text={NOT_LINKED} />;
  if (summary.isError) {
    if (summary.error instanceof MedicationRequestError && summary.error.status === 404)
      return <Notice text={NOT_LINKED} />;
    return <SelfLoadError label="hồ sơ của bạn" retry={() => void summary.refetch()} />;
  }
  if (!summary.data) return <SelfSkeleton label="hồ sơ của bạn" />;
  const profile = summary.data;
  const active = resolveSelfSection(section, profile.showsVitals);
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="rounded-xl bg-white p-5 shadow-sm lg:p-6">
        <h1 className="auth-heading text-2xl font-semibold tracking-tight text-[#131d1d] lg:text-[28px]">
          Hồ sơ của tôi
        </h1>
        <p className="mt-1 text-sm break-words text-[#404945]">{profile.displayName}</p>
      </header>
      {profile.consentStatus === 'confirmed' ? (
        <>
          <SelfTabs active={active} showsVitals={profile.showsVitals} />
          <SelfSection session={session} section={active} />
        </>
      ) : (
        <Notice text="Hồ sơ chưa được đồng ý lưu dữ liệu." />
      )}
    </div>
  );
}
