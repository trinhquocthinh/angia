import { useState } from 'react';
import type { Account, AdminCommand, Family } from '../../application/ports';
import { AdminCardHeading } from './AdminCardHeading';
import { AdminIcon } from './AdminIcon';
import { PendingAssignmentForm } from './PendingAssignmentForm';

function PendingBadge({ count }: { count: number }) {
  return count > 0 ? (
    <span className="shrink-0 rounded-full bg-warning-soft px-3 py-1 text-caption font-semibold text-warning tabular-nums">
      {count} tài khoản
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-caption font-semibold text-on-secondary-container">
      Đã phân bổ đủ
    </span>
  );
}

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
      className="profile-bento-card relative flex min-w-0 flex-col justify-between gap-4 overflow-hidden p-5 sm:p-6 [&_fieldset]:m-0 [&_fieldset]:grid [&_fieldset]:min-w-0 [&_fieldset]:gap-3.5 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_form]:grid [&_form]:gap-4 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-caption [&_label]:font-semibold [&_label]:text-text-secondary"
      aria-labelledby="pending-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-accent/5"
      />
      <div className="relative z-10 flex flex-col gap-4">
        <AdminCardHeading
          id="pending-title"
          icon={<AdminIcon name="person_add" />}
          title="Chờ vào nhóm"
          aside={<PendingBadge count={waiting.length} />}
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
          <p className="m-0 rounded-2xl border border-dashed border-border/55 bg-bg p-4 text-caption text-text-secondary">
            Không có tài khoản chờ gán nhóm.
          </p>
        )}
      </div>
    </section>
  );
}
