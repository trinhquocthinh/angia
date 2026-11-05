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
import { ReviewDetail } from './components/ReviewDetail';
import { ReviewNotice } from './components/ReviewNotice';
import { ReviewQueue } from './components/ReviewQueue';
import { UploadedNotice } from './components/UploadedNotice';

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
  const names = new Map(profiles.map((profile) => [profile.id, profile.displayName]));
  const documents = queue.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      <UploadedNotice />
      {deleted && <DeletedDocumentNotice />}
      {main ? (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className={documentId ? 'max-lg:hidden' : ''}>
            <ReviewQueue
              documents={documents}
              profileNames={names}
              activeId={documentId}
              loading={queue.isPending}
              error={queue.isError}
              retry={() => void queue.refetch()}
              more={
                queue.hasNextPage
                  ? { loading: queue.isFetchingNextPage, load: () => void queue.fetchNextPage() }
                  : null
              }
            />
          </div>
          <div className={documentId ? '' : 'max-lg:hidden'}>
            {documentId ? (
              <ReviewDetail
                repository={reviewRepository}
                session={session.data}
                documentId={documentId}
                queue={documents}
                profileNames={names}
              />
            ) : (
              <ReviewNotice
                title={documents.length ? 'Chọn một giấy tờ để kiểm tra' : 'Không còn giấy tờ chờ kiểm tra'}
                body="Hình chụp hiện bên trái, thông tin tự động nhận diện hiện bên phải để bạn đối chiếu."
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
