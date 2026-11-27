import { useId } from 'react';
import type { AdminAuditFilters, AdminAuditFilterErrors } from '../../application/AdminAuditFilters';
import { adminAuditActionLabels } from '../../application/adminAuditActionLabel';
import { AdminSelect } from './AdminSelect';
import { AdminAuditFilterInput } from './AdminAuditFilterInput';
type Props = {
  draft: AdminAuditFilters;
  errors: AdminAuditFilterErrors;
  onChange: (key: keyof AdminAuditFilters, value: string) => void;
};
export function AdminAuditFilterFields({ draft, errors, onChange }: Props) {
  const dateErrorId = useId();
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      {(['from', 'to'] as const).map((key) => (
        <AdminAuditFilterInput
          key={key}
          label={key === 'from' ? 'Từ ngày' : 'Đến ngày'}
          type="date"
          value={draft[key]}
          onChange={(value) => onChange(key, value)}
          describedBy={errors.dates ? dateErrorId : undefined}
        />
      ))}
      {errors.dates && (
        <p id={dateErrorId} role="status" className="m-0 text-caption text-danger sm:col-span-2">
          {errors.dates}
        </p>
      )}
      <label className="flex min-w-0 flex-col gap-2 text-body text-text-secondary sm:col-span-2">
        <span>Loại sự kiện</span>
        <AdminSelect value={draft.action} onChange={(event) => onChange('action', event.target.value)}>
          <option value="">Tất cả</option>
          {Object.entries(adminAuditActionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </AdminSelect>
      </label>
      {(['familyId', 'accountId'] as const).map((key) => (
        <AdminAuditFilterInput
          key={key}
          label={key === 'familyId' ? 'Mã nhà' : 'Mã tài khoản'}
          value={draft[key]}
          onChange={(value) => onChange(key, value)}
          error={errors[key]}
        />
      ))}
    </div>
  );
}
