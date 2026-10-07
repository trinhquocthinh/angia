import type { AdminCommand, FamilyRole } from '../application/ports';
import type { AdminTask } from './AdminTask';

export function readAdminCommand(task: AdminTask, form: FormData): AdminCommand {
  if (task.kind === 'create') return { type: 'create', name: String(form.get('name') ?? '') };
  const accountId = task.account.id;
  if (task.kind === 'remove') return { type: 'remove', accountId };
  const role: FamilyRole = form.get('role') === 'member' ? 'member' : 'main';
  if (task.kind === 'role') return { type: 'role', accountId, role };
  return { type: 'assign', accountId, familyId: String(form.get('familyId') ?? ''), role };
}
