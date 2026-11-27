import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { SignedInHouseholdInvitation } from './SignedInHouseholdInvitation';

// Chỉ mount khi có phiên: lúc chuyển sang /login router còn giữ màn này, không được inspect.
export function HouseholdInvitationLinkPage() {
  const session = useCurrentSession(fetchCurrentSession);
  return session.data ? <SignedInHouseholdInvitation session={session.data} /> : null;
}
