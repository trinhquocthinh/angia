import type { IdpFailureReason } from './ports.js';

// Lỗi đọc Authentik đã quy về mã lý do cố định; message không chứa phản hồi gốc của IdP.
export class IdpDirectoryError extends Error {
  constructor(
    readonly reason: IdpFailureReason,
    readonly status?: number,
  ) {
    super(reason);
    this.name = 'IdpDirectoryError';
  }
}
