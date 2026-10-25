import { ProfileTopbar } from './ProfileTopbar';
import type { ReactNode } from 'react';
import type { HealthProfile, ProfileSession } from '../../application/ports';
import { ProfileSidebar } from './ProfileSidebar';
import { MobileTopbar } from './MobileTopbar';
import { MobileAccountMenu } from './MobileAccountMenu';
import { MobileBottomNav } from './MobileBottomNav';
import { useReviewQueue } from '@src/features/documents/application/useReviewWorkspace';
import { createReviewRepository } from '@src/features/documents/infrastructure/createReviewRepository';

const reviewRepository = createReviewRepository();
// Desktop (≥ lg): sidebar cố định + header; di động: header gọn + thanh điều hướng đáy.
export function ProfileFrame({
  session,
  profiles,
  logout,
  mobileTitle,
  children,
}: {
  session: ProfileSession;
  profiles: HealthProfile[];
  logout: { isPending: boolean; isError: boolean; mutate: () => void };
  mobileTitle?: string;
  children: ReactNode;
}) {
  const queue = useReviewQueue(reviewRepository, session);
  const pendingCount = queue.data?.pages.reduce((sum, page) => sum + page.items.length, 0);
  return (
    <div className="min-h-dvh bg-[#f0fcfb] text-[#131d1d]">
      <ProfileSidebar
        session={session}
        profiles={profiles}
        pending={logout.isPending}
        error={logout.isError}
        onLogout={() => logout.mutate()}
        pendingCount={pendingCount}
      />
      <div className="min-w-0 lg:ml-[240px]">
        <ProfileTopbar profiles={profiles} hasFamily={Boolean(session.family)} />
        <MobileTopbar
          title={mobileTitle}
          hasFamily={Boolean(session.family)}
          account={
            <MobileAccountMenu
              session={session}
              pending={logout.isPending}
              error={logout.isError}
              onLogout={() => logout.mutate()}
            />
          }
        />
        <div className="mx-auto max-w-[1440px] px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-10">
          {children}
        </div>
      </div>
      <MobileBottomNav pendingCount={pendingCount} />
    </div>
  );
}
