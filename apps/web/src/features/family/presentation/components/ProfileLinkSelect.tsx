import type { Account, AdminProfileLink } from '../../application/ports';
import { AdminSelect } from './AdminSelect';

export function ProfileLinkSelect({
  linkedAccount,
  candidates,
  value,
  pending,
  onChange,
}: {
  linkedAccount: AdminProfileLink['linkedAccount'];
  candidates: Account[];
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs text-text-secondary">
      Tài khoản liên kết
      <AdminSelect value={value} disabled={pending} onChange={(event) => onChange(event.target.value)}>
        <option value="">Không liên kết</option>
        {linkedAccount && <option value={linkedAccount.id}>{linkedAccount.displayName}</option>}
        {candidates.map((account) => (
          <option key={account.id} value={account.id}>
            {account.displayName}
          </option>
        ))}
      </AdminSelect>
    </label>
  );
}
