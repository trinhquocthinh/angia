import type { ProfileSession } from '../../application/ports';
export type AccountMenuProps = {
  session: ProfileSession;
  pending: boolean;
  error: boolean;
  onLogout: () => void;
};
export type AccountMenuAnchor = { top: number; right: number };
