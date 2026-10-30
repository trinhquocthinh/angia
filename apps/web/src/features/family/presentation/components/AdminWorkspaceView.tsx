import type { useAdminScanQuota } from '@src/features/scanQuota/application/useAdminScanQuota';
import type { useAiBilling } from '@src/features/aiBilling/application/useAiBilling';
import type { useAiRouting } from '@src/features/aiRouting/application/useAiRouting';
import { useState } from 'react';
import type { useAdminWorkspace } from '../../application/useAdminWorkspace';
import type { useAiBudget } from '../../application/useAiBudget';
import type { AdminTask } from '../AdminTask';
import type { AdminSession } from '../AdminSession';
import { AdminFrame, type AdminFrameShell } from './AdminFrame';
import { AdminHeading } from './AdminHeading';
import { AdminDataContent } from './AdminDataContent';
import { ActionDialog } from './ActionDialog';

type AdminWorkspaceViewProps = {
  session: AdminSession;
  shell: AdminFrameShell;
  workspace: ReturnType<typeof useAdminWorkspace>;
  aiBudget: ReturnType<typeof useAiBudget>;
  aiRouting: ReturnType<typeof useAiRouting>;
  aiBilling: ReturnType<typeof useAiBilling>;
  scanQuota: ReturnType<typeof useAdminScanQuota>;
};

export function AdminWorkspaceView(props: AdminWorkspaceViewProps) {
  const { session, shell, workspace, aiBudget, aiRouting, aiBilling, scanQuota } = props;
  const { families, accounts, action } = workspace;
  const [task, setTask] = useState<AdminTask | null>(null);
  const [accountQuery, setAccountQuery] = useState('');
  const openTask = (next: AdminTask) => {
    action.reset();
    setTask(next);
  };
  const busy = action.isPending || [families, accounts].some((query) => query.isPending || query.isError);
  return (
    <AdminFrame session={session} shell={shell}>
      <AdminHeading
        families={families.data?.length ?? 0}
        accounts={accounts.data?.length ?? 0}
        waiting={accounts.data?.filter((account) => !account.familyId).length ?? 0}
        disabled={busy}
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
        {...{ workspace, aiBudget, aiRouting, aiBilling, scanQuota }}
        currentAccountId={session.account.id}
        onTask={openTask}
        accountQuery={accountQuery}
        onAccountQuery={setAccountQuery}
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
