import { Link } from '@tanstack/react-router';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { useProfileSessionRecovery } from '@src/features/profiles/application/useProfileSessionRecovery';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { HomePage } from '@src/features/profiles/presentation/HomePage';
import { Button } from '@src/shared/ui/button/Button';
import { TodayProfiles } from './TodayProfiles';
import { TodaySelf } from './TodaySelf';
import '@src/features/profiles/presentation/profiles.css';

const repository = createProfilesRepository();

export function TodayPage() {
  const current = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(repository, current.data);
  useProfileSessionRecovery(workspace.profiles.error);
  const session = current.data;
  if (!session) return null;
  if (!session.family || (session.role !== 'main' && !session.account.healthProfileId)) return <HomePage />;
  const main = session.role === 'main';
  const profiles = main && workspace.profiles.isSuccess ? workspace.profiles.data : [];
  return (
    <ProfileFrame session={session} profiles={profiles} logout={workspace.logout} mobileTitle="Hôm nay">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6 pb-24 font-sans text-lg leading-7">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[26px] leading-[34px] font-semibold">Liều hôm nay</h1>
          <Link
            to="/"
            search={{ view: 'profiles' }}
            className="inline-flex min-h-12 items-center rounded-xl border border-border px-4 py-2 text-lg leading-6 font-semibold focus-visible:outline-3 focus-visible:outline-focus"
          >
            {main ? 'Hồ sơ gia đình' : 'Quản lý liên kết hồ sơ'}
          </Link>
        </header>
        {main ? (
          workspace.profiles.isError ? (
            <div role="alert" className="flex flex-col items-start gap-4">
              <p>Không thể tải hồ sơ gia đình.</p>
              <Button
                variant="secondary"
                disabled={workspace.profiles.isFetching}
                onClick={() => void workspace.profiles.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : workspace.profiles.isPending ? (
            <p role="status">Đang tải hồ sơ gia đình…</p>
          ) : (
            <TodayProfiles
              key={`${session.account.id}:${session.family.id}:${session.account.healthProfileId}`}
              session={session}
              profiles={profiles}
            />
          )
        ) : (
          <TodaySelf
            key={`${session.account.id}:${session.family.id}:${session.account.healthProfileId}`}
            session={session}
          />
        )}
      </div>
    </ProfileFrame>
  );
}
