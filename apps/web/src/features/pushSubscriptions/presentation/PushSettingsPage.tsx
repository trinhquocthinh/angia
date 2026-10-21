import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { PushSettingsPanel } from './PushSettingsPanel';
export function PushSettingsPage() {
  const session = useCurrentSession(fetchCurrentSession);
  if (!session.data) return null;
  if (!session.data.family)
    return <p role="alert">Tài khoản cần được gán vào gia đình trước khi bật thông báo.</p>;
  return <PushSettingsPanel key={session.data.csrfToken} csrf={session.data.csrfToken} />;
}
