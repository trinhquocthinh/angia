import type { DirectoryMember, LocalAccount } from '../domain/planIdpSync.js';

export type IdpFailureReason =
  | 'idp_unreachable'
  | 'idp_timeout'
  | 'idp_http_401'
  | 'idp_http_403'
  | 'idp_http_error'
  | 'idp_bad_response'
  | 'group_not_found';

export interface IdpDirectory {
  // Thành viên trực tiếp của nhóm; lỗi ném IdpDirectoryError.
  fetchGroupMembers(groupName: string): Promise<DirectoryMember[]>;
}

interface IdpSyncChange {
  revoke: string[];
  adminOn: string[];
  adminOff: string[];
}

export interface AccountSessionStore {
  // hasSession = có phiên expires_at > now.
  listAccounts(now: Date): Promise<LocalAccount[]>;
  // Xóa phiên tạo trước createdBefore + cập nhật is_system_admin trong một transaction.
  // createdBefore = mốc trước khi đọc Authentik: phiên đăng nhập giữa lượt không bị xóa theo ảnh chụp cũ.
  apply(change: IdpSyncChange, createdBefore: Date): Promise<void>;
}

export interface IdpSyncDependencies {
  directory: IdpDirectory;
  store: AccountSessionStore;
}

export interface IdpSyncPolicy {
  accessGroupName: string;
  adminGroupName: string;
  maxRevokes: number;
  dryRun: boolean;
  now(): Date;
}

export interface IdpSyncResult extends IdpSyncChange {
  outcome: 'applied' | 'skipped' | 'error';
  reason?: IdpFailureReason | 'access_group_empty' | 'access_group_no_match' | 'db_error';
  // Chỉ khi reason = idp_http_error.
  status?: number;
  capped: boolean;
  dryRun: boolean;
}
