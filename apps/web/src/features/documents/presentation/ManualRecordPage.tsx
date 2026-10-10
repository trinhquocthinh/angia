import { useNavigate } from '@tanstack/react-router';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfileSessionRecovery } from '@src/features/profiles/application/useProfileSessionRecovery';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { RecipientNotice } from '@src/features/profiles/presentation/components/RecipientNotice';
import '@src/features/profiles/presentation/profiles.css';
import { ReviewRequestError } from '../application/ReviewRequestError';
import { useDuplicatePrompt } from '../application/useDuplicatePrompt';
import { useCreateManualRecords } from '../application/useReviewWorkspace';
import { createReviewRepository } from '../infrastructure/createReviewRepository';
import { DuplicateNotice } from './components/DuplicateNotice';
import { ManualRecordContent } from './components/ManualRecordContent';
import { ReviewLoading } from './components/ReviewLoading';

const profilesRepository = createProfilesRepository();
const reviewRepository = createReviewRepository();

// `/profiles/:id/manual` (SPEC-011): nhập số đo, đơn thuốc hoặc phiếu xét nghiệm không kèm ảnh.
export function ManualRecordPage({ profileId }: { profileId: string }) {
  const navigate = useNavigate();
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const create = useCreateManualRecords(reviewRepository, session.data, profileId);
  const error = create.error instanceof ReviewRequestError ? create.error : null;
  const duplicate = useDuplicatePrompt((request) => create.mutate(request), error);
  useProfileSessionRecovery(workspace.profiles.error);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  const profiles = workspace.profiles.data ?? [];
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      {!main ? (
        <RecipientNotice />
      ) : workspace.profiles.isPending ? (
        <ReviewLoading />
      ) : (
        <ManualRecordContent
          profile={profiles.find((item) => item.id === profileId) ?? null}
          saved={create.isSuccess}
          pending={create.isPending}
          error={duplicate.formError}
          onSubmit={duplicate.submit}
          notice={
            duplicate.prompt && (
              <DuplicateNotice
                duplicate={duplicate.prompt.record}
                type={duplicate.prompt.type}
                pending={create.isPending}
                onConfirm={() => create.mutate(duplicate.prompt!.request)}
              />
            )
          }
          onAgain={() => create.reset()}
          onBack={() => void navigate({ to: '/profiles/$profileId', params: { profileId } })}
        />
      )}
    </ProfileFrame>
  );
}
