import { useLocation } from '@tanstack/react-router';
import { ProfileTopbar } from './ProfileTopbar';
import type { ReactNode } from 'react';
import type { HealthProfile, ProfileSession } from '../../application/ports';
import { MobileTopbar } from './MobileTopbar';
import { AccountMenu } from './AccountMenu';
import { MobileBottomNav } from './MobileBottomNav';
import { ProfileFooter } from './ProfileFooter';
import { useReviewQueue } from '@src/features/documents/application/useReviewWorkspace';
import { createReviewRepository } from '@src/features/documents/infrastructure/createReviewRepository';
import '@src/features/family/presentation/admin-icons.css';

const reviewRepository = createReviewRepository();
// Desktop (≥ lg): header bám đầu trang; di động: header gọn + thanh điều hướng đáy.
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
  const { pathname } = useLocation();
  const unlinkedMember = session.role === 'member' && !session.account.healthProfileId;
  const showNavigation = Boolean(session.family && session.role) && !/^\/admin(?:\/|$)/.test(pathname);
  const queue = useReviewQueue(reviewRepository, session);
  const pendingCount = queue.data?.pages.reduce((sum, page) => sum + page.items.length, 0);
  const personal = session.role === 'member';
  const account = (
    <AccountMenu
      session={session}
      pending={logout.isPending}
      error={logout.isError}
      onLogout={() => logout.mutate()}
    />
  );
  return (
    <div
      className={`flex min-h-dvh flex-col bg-bg text-text-primary${showNavigation ? ' profile-frame-navigation' : ''}`}
    >
      <ProfileTopbar
        profiles={profiles}
        hasFamily={Boolean(session.family)}
        showNavigation={showNavigation}
        showSearch={!unlinkedMember}
        pendingCount={pendingCount}
        account={account}
        personal={personal}
      />
      <MobileTopbar title={mobileTitle} hasFamily={Boolean(session.family)} account={account} />
      <main className="mx-auto w-full min-w-0 flex-1 px-4 pt-3 lg:px-8 lg:py-12">{children}</main>
      <ProfileFooter />
      {showNavigation && <MobileBottomNav pendingCount={pendingCount} personal={personal} />}
    </div>
  );
}
