import { AdminSelect } from './AdminSelect';
import { useState } from 'react';
import type { Account, Family } from '../../application/ports';

export function MembershipFields({
  families,
  accounts,
  account,
  assign,
}: {
  families: Family[];
  accounts: Account[];
  account: Account;
  assign: boolean;
}) {
  const [familyId, setFamilyId] = useState(assign ? (families[0]?.id ?? '') : (account.familyId ?? ''));
  const emptyFamily = assign && !accounts.some((item) => item.familyId === familyId);
  return (
    <>
      {assign && (
        <label>
          Nhóm gia đình
          <AdminSelect
            name="familyId"
            value={familyId}
            onChange={(event) => setFamilyId(event.target.value)}
            required
          >
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </AdminSelect>
        </label>
      )}
      <label>
        Vai trò
        <AdminSelect
          name="role"
          key={`${familyId}-${emptyFamily}`}
          defaultValue={emptyFamily ? 'main' : (account.role ?? 'member')}
          required
        >
          <option value="main">Quản trị chính</option>
          <option value="member" disabled={emptyFamily}>
            Thành viên
          </option>
        </AdminSelect>
      </label>
      {emptyFamily && (
        <p className="admin-hint text-[#286958] m-0">Tài khoản đầu tiên của nhóm phải là Quản trị chính.</p>
      )}
    </>
  );
}
