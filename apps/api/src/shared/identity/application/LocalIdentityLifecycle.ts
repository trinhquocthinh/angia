// Primitive hạ tầng; caller kiểm quyền, điều kiện xoá và ghi audit trong transaction ngoài.
export interface LocalIdentityLifecycle {
  lock(accountId: string, reason: string, now: Date): Promise<boolean>;
  unlock(accountId: string): Promise<boolean>;
  deleteUser(accountId: string): Promise<boolean>;
  revokeAll(accountId: string): Promise<boolean>;
}
