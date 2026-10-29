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
// Desktop (≥ lg): header cố định chứa điều hướng; di động: header gọn + thanh điều hướng đáy.
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
  const account = (
    <AccountMenu
      session={session}
      pending={logout.isPending}
      error={logout.isError}
      onLogout={() => logout.mutate()}
    />
  );
  return (
    <div className="flex min-h-dvh flex-col bg-[#f0fcfb] text-[#131d1d] lg:pt-[72px]">
      <ProfileTopbar
        profiles={profiles}
        hasFamily={Boolean(session.family)}
        pendingCount={pendingCount}
        account={account}
      />
      <MobileTopbar title={mobileTitle} hasFamily={Boolean(session.family)} account={account} />
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 pt-3 lg:px-8 lg:py-12">{children}</main>
      <ProfileFooter />
      <MobileBottomNav pendingCount={pendingCount} />
    </div>
  );
}
