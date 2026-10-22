import { ProfileTopbar } from './ProfileTopbar';
import type { ReactNode } from 'react';
import type { HealthProfile, ProfileSession } from '../../application/ports';
import { ProfileSidebar } from './ProfileSidebar';
import { useReviewQueue } from '@src/features/documents/application/useReviewWorkspace';
import { createReviewRepository } from '@src/features/documents/infrastructure/createReviewRepository';

const reviewRepository = createReviewRepository();
export function ProfileFrame({
  session,
  profiles,
  logout,
  children,
}: {
  session: ProfileSession;
  profiles: HealthProfile[];
  logout: { isPending: boolean; isError: boolean; mutate: () => void };
  children: ReactNode;
}) {
  const queue = useReviewQueue(reviewRepository, session);
  return (
    <div className="min-h-dvh bg-[#f0fcfb] text-[#131d1d]">
      <ProfileSidebar
        session={session}
        profiles={profiles}
        pending={logout.isPending}
        error={logout.isError}
        onLogout={() => logout.mutate()}
        pendingCount={queue.data?.pages.reduce((sum, page) => sum + page.items.length, 0)}
      />
      <div className="min-w-0 lg:ml-[240px]">
        <ProfileTopbar profiles={profiles} hasFamily={Boolean(session.family)} />
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
