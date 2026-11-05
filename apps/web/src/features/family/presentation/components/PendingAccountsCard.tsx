import { useState } from 'react';
import type { Account, AdminCommand, Family } from '../../application/ports';
import { AdminCardHeading } from './AdminCardHeading';
import { AdminIcon } from './AdminIcon';
import { PendingAssignmentForm } from './PendingAssignmentForm';

export function PendingAccountsCard({
  accounts,
  families,
  pending,
  error,
  onSubmit,
}: {
  accounts: Account[];
  families: Family[];
  pending: boolean;
  error: Error | null;
  onSubmit: (command: AdminCommand) => void;
}) {
  const waiting = accounts.filter((account) => !account.familyId);
  const [selectedId, setSelectedId] = useState('');
  const account = waiting.find((item) => item.id === selectedId) ?? waiting[0];
  return (
    <section
      className="admin-panel min-w-0 rounded-2xl bg-white p-5 shadow-sm admin-pending-panel [&_form]:grid [&_form]:gap-4 [&_form]:mt-4 [&_fieldset]:grid [&_fieldset]:gap-3 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0 [&_fieldset]:min-w-0 [&_label]:grid [&_label]:gap-[6px] [&_label]:text-xs [&_label]:font-semibold [&_label]:text-[#404945] [&_.admin-hint]:text-xs [&_.admin-hint]:leading-[18px] [&_.admin-button]:w-full [&_.admin-button]:bg-[#004135]! [&_.admin-button:hover]:bg-[#20594b]! max-[600px]:p-4 admin-reveal"
      aria-labelledby="pending-title"
    >
      <AdminCardHeading
        id="pending-title"
        icon={<AdminIcon name="person_add" />}
        title="Chờ vào nhóm"
        aside={
          waiting.length > 0 && (
            <span className="shrink-0 rounded-full bg-[#ffdbc9] px-2.5 py-1 text-xs font-semibold text-[#753400]">
              {waiting.length} tài khoản
            </span>
          )
        }
      />
      {account ? (
        <PendingAssignmentForm
          account={account}
          waiting={waiting}
          accounts={accounts}
          families={families}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
          onSelect={setSelectedId}
        />
      ) : (
        <p className="mt-3 mb-0 text-[#55615f] text-[13px] leading-[20px]">
          Không có tài khoản chờ gán nhóm.
        </p>
      )}
    </section>
  );
}
