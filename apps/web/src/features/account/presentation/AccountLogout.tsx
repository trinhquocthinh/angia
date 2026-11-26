import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CURRENT_SESSION_KEY } from '@src/features/auth/application/useCurrentSession';
import { logoutSession } from '@src/features/auth/infrastructure/logoutSession';
import {
  PASSWORD_RESET_BY_KEY,
  RESTRICTED_CSRF_KEY,
  writeAccountStorage,
} from '../application/accountSessionStorage';
import { FormAlert } from './FormAlert';
export function AccountLogout({
  token,
  heading,
  icon,
}: {
  token: string;
  heading?: string;
  icon?: ReactNode;
}) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function logout() {
    setBusy(true);
    setError(null);
    try {
      await logoutSession(token);
      writeAccountStorage(RESTRICTED_CSRF_KEY, null);
      writeAccountStorage(PASSWORD_RESET_BY_KEY, null);
      await client.invalidateQueries({ queryKey: CURRENT_SESSION_KEY });
      await navigate({ to: '/login' });
    } catch {
      setError('Không thể đăng xuất. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="w-full">
      {heading && <p className="text-body font-medium text-text-secondary">{heading}</p>}
      <button
        type="button"
        disabled={busy || !token}
        onClick={() => void logout()}
        className="account-link inline-flex min-h-14 items-center gap-3 text-body"
      >
        {icon ?? (
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h12" />
          </svg>
        )}
        Đăng xuất
      </button>
      <FormAlert message={error} />
    </div>
  );
}
