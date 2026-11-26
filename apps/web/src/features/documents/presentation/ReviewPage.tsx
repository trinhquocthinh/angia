import { useRouterState } from '@tanstack/react-router';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfileSessionRecovery } from '@src/features/profiles/application/useProfileSessionRecovery';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { RecipientNotice } from '@src/features/profiles/presentation/components/RecipientNotice';
import '@src/features/profiles/presentation/profiles.css';
import { useReviewQueue } from '../application/useReviewWorkspace';
import { createReviewRepository } from '../infrastructure/createReviewRepository';
import { DeletedDocumentNotice } from './components/DeletedDocumentNotice';
import { ReviewWorkspace } from './components/ReviewWorkspace';
import { UploadedNotice } from './components/UploadedNotice';
import './review-layout.css';

const profilesRepository = createProfilesRepository();
const reviewRepository = createReviewRepository();

// Master–Detail trên desktop (hàng đợi | ảnh + form); di động: `/review` là danh sách, `/review/:id` là màn duyệt.
export function ReviewPage({ documentId = null }: { documentId?: string | null }) {
  const deleted = useRouterState({ select: (state) => state.location.state.deletedDocument });
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const queue = useReviewQueue(reviewRepository, session.data);
  useProfileSessionRecovery(workspace.profiles.error);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  const profiles = workspace.profiles.data ?? [];
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      <UploadedNotice />
      {deleted && <DeletedDocumentNotice />}
      {main ? (
        <ReviewWorkspace
          repository={reviewRepository}
          session={session.data}
          profiles={profiles}
          documentId={documentId}
          queue={queue}
        />
      ) : (
        <RecipientNotice />
      )}
    </ProfileFrame>
  );
}
