import { useState } from 'react';
import type { Account, AdminCommand, Family } from '../../application/ports';
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
      className="admin-panel min-w-0 bg-white rounded-[16px] shadow-[0_1px_2px_#0000000d] [&_h2]:leading-[24px] [&_h2]:font-semibold [&_h2]:m-0 admin-pending-panel p-5 [&_h2]:text-[16px] [&_form]:grid [&_form]:gap-4 [&_form]:mt-4 [&_fieldset]:grid [&_fieldset]:gap-3 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0 [&_fieldset]:min-w-0 [&_label]:grid [&_label]:gap-[6px] [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-[#404945] [&_.admin-hint]:text-[11px] [&_.admin-hint]:leading-[18px] [&_.admin-button]:w-full [&_.admin-button]:min-h-10 [&_.admin-button]:text-[12px] max-[600px]:p-4 admin-reveal"
      aria-labelledby="pending-title"
    >
      <div className="admin-heading-with-count flex items-center gap-2 text-[#286958] [&_h2]:text-[#131d1d]">
        <AdminIcon name="person_add" />
        <h2 id="pending-title">Chờ vào nhóm</h2>
        <span className="inline-flex items-center justify-center min-w-6 h-6 py-0 px-2 rounded-full bg-[#deebea] text-[12px] font-semibold text-[#404945]">
          {waiting.length}
        </span>
      </div>
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
        <p className="py-4 px-5 m-0 text-[#707975] text-[13px] leading-[20px]">
          Không có tài khoản chờ gán nhóm.
        </p>
      )}
    </section>
  );
}
