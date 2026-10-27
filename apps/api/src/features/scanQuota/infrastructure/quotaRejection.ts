import type { ScanQuotaError } from '../application/ports.js';
// Lỗi nghiệp vụ hủy toàn bộ transaction, kể cả các dòng khóa vừa tạo và audit.
export class QuotaRejection extends Error {
  constructor(readonly code: ScanQuotaError) {
    super(code);
    this.name = 'QuotaRejection';
  }
}
