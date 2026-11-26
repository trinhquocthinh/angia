import { AdminSelect } from './AdminSelect';
import type { PendingAssignmentProps } from '../PendingAssignmentProps';
import { MembershipFields } from './MembershipFields';
import { AdminIcon } from './AdminIcon';

export function AssignmentFields({
  account,
  waiting,
  accounts,
  families,
  pending,
  onSelect,
}: PendingAssignmentProps) {
  return (
    <fieldset disabled={pending || families.length === 0}>
      {waiting.length > 1 && (
        <label>
          Tài khoản
          <AdminSelect value={account.id} onChange={(event) => onSelect(event.target.value)}>
            {waiting.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </AdminSelect>
        </label>
      )}
      <MembershipFields key={account.id} families={families} accounts={accounts} account={account} assign />
      <button
        type="submit"
        className="inline-flex min-h-btn w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors enabled:hover:bg-accent-hover"
      >
        <AdminIcon name="check" size={18} />
        {pending ? 'Đang lưu...' : 'Thêm vào nhóm'}
      </button>
    </fieldset>
  );
}
