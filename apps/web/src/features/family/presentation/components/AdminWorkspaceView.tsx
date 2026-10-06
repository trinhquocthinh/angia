import { useState } from 'react';
import type { useAdminWorkspace } from '../../application/useAdminWorkspace';
import type { AdminTask } from '../AdminTask';
import type { AdminSession } from '../AdminSession';
import { AdminFrame } from './AdminFrame';
import { AdminHeading } from './AdminHeading';
import { AdminDataContent } from './AdminDataContent';
import { ActionDialog } from './ActionDialog';

export function AdminWorkspaceView({
  session,
  workspace,
}: {
  session: AdminSession;
  workspace: ReturnType<typeof useAdminWorkspace>;
}) {
  const { families, accounts, action } = workspace;
  const [task, setTask] = useState<AdminTask | null>(null);
  const openTask = (next: AdminTask) => {
    action.reset();
    setTask(next);
  };
  const unavailable =
    action.isPending || families.isPending || accounts.isPending || families.isError || accounts.isError;
  return (
    <AdminFrame session={session} accounts={accounts.data ?? []}>
      <AdminHeading
        families={families.data?.length ?? 0}
        accounts={accounts.data?.length ?? 0}
        disabled={unavailable}
        onCreate={() => openTask({ kind: 'create' })}
      />
      {action.isSuccess && !task && (
        <p
          className="rounded-[12px] py-3 px-4 m-0 text-[13px] leading-[20px] text-[#055141] bg-[#aef0da]"
          role="status"
        >
          Đã lưu thay đổi thành công.
        </p>
      )}
      <AdminDataContent
        workspace={workspace}
        onTask={openTask}
        currentFamilyId={session.family?.id ?? null}
        inlineError={task ? null : action.error}
        onSubmit={(command) => {
          action.reset();
          action.mutate(command);
        }}
      />
      {task && (
        <ActionDialog
          task={task}
          families={families.data ?? []}
          accounts={accounts.data ?? []}
          pending={action.isPending}
          error={action.error}
          onClose={() => setTask(null)}
          onSubmit={(command) => action.mutate(command, { onSuccess: () => setTask(null) })}
        />
      )}
    </AdminFrame>
  );
}
