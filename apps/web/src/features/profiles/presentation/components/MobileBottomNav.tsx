import { RoleNavigation } from '@src/shared/layout/RoleNavigation';

export function MobileBottomNav(props: { pendingCount?: number | undefined; personal?: boolean }) {
  return <RoleNavigation {...props} variant="responsive" />;
}
