import { MyConsentSection } from './components/MyConsentSection';
import { createMyConsentRepository } from '../infrastructure/createMyConsentRepository';
import { RecipientNotice } from './components/RecipientNotice';
import { useProfileSessionRecovery } from '../application/useProfileSessionRecovery';
import { useState } from 'react';
import { useReviewQueue } from '@src/features/documents/application/useReviewWorkspace';
import { createReviewRepository } from '@src/features/documents/infrastructure/createReviewRepository';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '../application/useProfilesWorkspace';
import type { ProfileListItem } from '../application/ports';
import { createProfilesRepository } from '../infrastructure/createProfilesRepository';
import { ProfileFrame } from './components/ProfileFrame';
import { ProfilesContent } from './components/ProfilesContent';
import { ProfileDialogs } from './components/ProfileDialogs';
import { HomeHeading } from './components/HomeHeading';
import { PendingReviewBanner } from './components/PendingReviewBanner';
import { ProfileSearch } from './components/ProfileSearch';
import './profiles.css';
const repository = createProfilesRepository();
const consentRepository = createMyConsentRepository();
const reviewRepository = createReviewRepository();
export function HomePage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(repository, session.data);
  const queue = useReviewQueue(reviewRepository, session.data);
  const [selected, setSelected] = useState<ProfileListItem | null>(null);
  const [deleting, setDeleting] = useState<ProfileListItem | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  useProfileSessionRecovery(workspace.profiles.error ?? workspace.accounts.error ?? workspace.create.error);
  if (!session.data) return null;
  const profiles = workspace.profiles.data ?? [];
  const main = session.data.role === 'main';
  const subtitle =
    main && workspace.profiles.isSuccess ? `${profiles.length} hồ sơ thành viên` : 'Sổ sức khỏe gia đình';
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      <MyConsentSection
        repository={consentRepository}
        session={session.data}
        open={withdrawing}
        setOpen={setWithdrawing}
        showCard={!main}
      />
      {main && <ProfileSearch profiles={profiles} className="mb-3 lg:hidden" />}
      <HomeHeading familyName={session.data.family?.name} subtitle={subtitle} canCreate={main} />
      {main && (
        <PendingReviewBanner count={queue.data?.pages.reduce((sum, page) => sum + page.items.length, 0)} />
      )}
      {main ? (
        <ProfilesContent
          profiles={profiles}
          loading={workspace.profiles.isPending}
          error={workspace.profiles.isError}
          retry={() => void workspace.profiles.refetch()}
          onConsent={setSelected}
          onDelete={setDeleting}
          ownProfileId={session.data.account.healthProfileId}
          onWithdraw={() => setWithdrawing(true)}
        />
      ) : (
        <RecipientNotice />
      )}
      {main && (
        <ProfileDialogs
          session={session.data}
          repository={repository}
          profiles={profiles}
          consent={selected}
          deleting={deleting}
          closeConsent={() => setSelected(null)}
          closeDelete={() => setDeleting(null)}
        />
      )}
    </ProfileFrame>
  );
}
