import { useState } from 'react';
import type { AdminAuditQuery } from '../../application/ports';
import type { AdminAuditFilterErrors } from '../../application/AdminAuditFilters';
import { emptyAdminAuditFilters } from '../../application/AdminAuditFilters';
import { mapAdminAuditFilters } from '../../application/mapAdminAuditFilters';
import { AdminAuditFilterFields } from './AdminAuditFilterFields';
export function AdminAuditFilters({ onApply }: { onApply: (query: AdminAuditQuery) => void }) {
  const [draft, setDraft] = useState(emptyAdminAuditFilters);
  const [errors, setErrors] = useState<AdminAuditFilterErrors>({});
  const update = (key: keyof typeof draft, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const clear = () => {
    setDraft(emptyAdminAuditFilters);
    setErrors({});
    onApply({ limit: 50 });
  };
  return (
    <form
      noValidate
      aria-label="Lọc nhật ký"
      className="flex min-w-0 flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const result = mapAdminAuditFilters(draft);
        setErrors(result.errors);
        if (result.query) onApply(result.query);
      }}
    >
      <AdminAuditFilterFields draft={draft} errors={errors} onChange={update} />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-2xl bg-accent px-4 py-2 text-body font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus min-h-11"
        >
          Áp dụng
        </button>
        <button
          type="button"
          className="rounded-2xl border border-border/45 bg-bg px-4 py-2 text-body text-text-primary disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus min-h-11"
          onClick={clear}
        >
          Xoá lọc
        </button>
      </div>
    </form>
  );
}
