import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { AdminRequestError } from '../application/AdminRequestError';
import { useAdminWorkspace } from '../application/useAdminWorkspace';
import { useAiBudget } from '../application/useAiBudget';
import { createAdminRepository } from '../infrastructure/createAdminRepository';
import { createAiBudgetRepository } from '../infrastructure/createAiBudgetRepository';
import { AdminWorkspaceView } from './components/AdminWorkspaceView';
import './admin.css';

const repository = createAdminRepository();
const aiBudgetRepository = createAiBudgetRepository();
export function AdminPage() {
  const session = useCurrentSession(fetchCurrentSession);
  const client = useQueryClient();
  const csrf = session.data?.account.isSystemAdmin ? session.data.csrfToken : null;
  const workspace = useAdminWorkspace(repository, csrf);
  const aiBudget = useAiBudget(aiBudgetRepository, csrf);
  const error = workspace.families.error ?? workspace.accounts.error ?? aiBudget.budget.error;
  useEffect(() => {
    if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
      void client.invalidateQueries({ queryKey: ['current-session'] });
    }
  }, [client, error]);
  if (!csrf || !session.data) return null;
  return <AdminWorkspaceView session={session.data} workspace={workspace} aiBudget={aiBudget} />;
}
