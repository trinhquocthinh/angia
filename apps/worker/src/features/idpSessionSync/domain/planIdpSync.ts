// Thành viên trực tiếp của một nhóm Authentik; uid = claim sub (Subject mode hashed user ID).
export interface DirectoryMember {
  uid: string;
  isActive: boolean;
}

export interface LocalAccount {
  id: string;
  oidcSubject: string;
  isSystemAdmin: boolean;
  // Có ít nhất một phiên còn hạn.
  hasSession: boolean;
}

export interface IdpSyncPlan {
  revoke: string[];
  adminOn: string[];
  adminOff: string[];
  capped: boolean;
  skipReason?: 'access_group_empty';
}

const activeUids = (members: DirectoryMember[]) =>
  new Set(members.filter((member) => member.isActive).map((member) => member.uid));

// BR-045: thu hồi phiên của tài khoản không còn active ∧ thuộc nhóm truy cập; is_system_admin bám nhóm admin.
// Nhóm truy cập rỗng → không đổi gì (chống đăng xuất hàng loạt khi cấu hình sai); vượt trần → không thu hồi ai.
export function planIdpSync(input: {
  accounts: LocalAccount[];
  access: DirectoryMember[];
  admins: DirectoryMember[];
  maxRevokes: number;
}): IdpSyncPlan {
  if (input.access.length === 0)
    return { revoke: [], adminOn: [], adminOff: [], capped: false, skipReason: 'access_group_empty' };
  const allowed = activeUids(input.access);
  const admins = activeUids(input.admins);
  const revoke = input.accounts
    .filter((account) => account.hasSession && !allowed.has(account.oidcSubject))
    .map((account) => account.id);
  const adminOn: string[] = [];
  const adminOff: string[] = [];
  for (const account of input.accounts) {
    const shouldBeAdmin = admins.has(account.oidcSubject);
    if (shouldBeAdmin && !account.isSystemAdmin) adminOn.push(account.id);
    if (!shouldBeAdmin && account.isSystemAdmin) adminOff.push(account.id);
  }
  const capped = revoke.length > input.maxRevokes;
  return { revoke: capped ? [] : revoke, adminOn, adminOff, capped };
}
