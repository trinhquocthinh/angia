import { RoleNavigation } from '@src/shared/layout/RoleNavigation';

export function TopbarNav(props: { pendingCount?: number | undefined; personal?: boolean }) {
  return <RoleNavigation {...props} variant="topbar" />;
}
