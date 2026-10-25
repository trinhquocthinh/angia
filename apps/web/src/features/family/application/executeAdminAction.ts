import { AdminRequestError } from './AdminRequestError';
import type { AdminCommand, AdminRepository } from './ports';

export async function executeAdminAction(
  repository: AdminRepository,
  csrfToken: string,
  command: AdminCommand,
) {
  if (!csrfToken) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
  switch (command.type) {
    case 'create': {
      const name = command.name.trim();
      if (!name || name.length > 60) throw new AdminRequestError('ERR_VALIDATION', 422);
      return repository.createFamily(name, csrfToken);
    }
    case 'assign':
      return repository.assign(command.accountId, command.familyId, command.role, csrfToken);
    case 'role':
      return repository.change(command.accountId, { action: 'change_role', role: command.role }, csrfToken);
    case 'remove':
      return repository.change(command.accountId, { action: 'remove' }, csrfToken);
  }
}
