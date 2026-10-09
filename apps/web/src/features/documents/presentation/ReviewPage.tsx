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
import { createPrivacyRepository } from '../infrastructure/createPrivacyRepository';
import { ReviewDetail } from './components/ReviewDetail';
import { ReviewNotice } from './components/ReviewNotice';
import { ReviewQueue } from './components/ReviewQueue';
import { UploadedNotice } from './components/UploadedNotice';

const profilesRepository = createProfilesRepository();
const reviewRepository = createReviewRepository();
const privacyRepository = createPrivacyRepository();

// Master–Detail trên desktop (hàng đợi | ảnh + form); di động: `/review` là danh sách, `/review/:id` là màn duyệt.
export function ReviewPage({ documentId = null }: { documentId?: string | null }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const queue = useReviewQueue(reviewRepository, session.data);
  useProfileSessionRecovery(workspace.profiles.error);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  const profiles = workspace.profiles.data ?? [];
  const names = new Map(profiles.map((profile) => [profile.id, profile.displayName]));
  const documents = queue.data ?? [];
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      <UploadedNotice />
      {main ? (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className={documentId ? 'max-lg:hidden' : ''}>
            <ReviewQueue
              documents={documents}
              profileNames={names}
              activeId={documentId}
              loading={queue.isPending}
              error={queue.isError}
              retry={() => void queue.refetch()}
            />
          </div>
          <div className={documentId ? '' : 'max-lg:hidden'}>
            {documentId ? (
              <ReviewDetail
                repository={reviewRepository}
                privacyRepository={privacyRepository}
                session={session.data}
                documentId={documentId}
                queue={documents}
                profileNames={names}
              />
            ) : (
              <ReviewNotice
                title={documents.length ? 'Chọn một chứng từ để duyệt' : 'Không còn chứng từ chờ duyệt'}
                body="Ảnh chứng từ hiện bên trái, thông tin AI đọc được hiện bên phải để bạn đối chiếu."
              />
            )}
          </div>
        </div>
      ) : (
        <RecipientNotice />
      )}
    </ProfileFrame>
  );
}
