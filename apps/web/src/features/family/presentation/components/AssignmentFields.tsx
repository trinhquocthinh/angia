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
        className="admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-[#286958] text-white text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_#0000000d] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-[#004135] [&:hover]:shadow-[0_4px_12px_#0041350f] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none"
      >
        <AdminIcon name="check" size={18} />
        {pending ? 'Đang lưu...' : 'Thêm vào nhóm'}
      </button>
    </fieldset>
  );
}
