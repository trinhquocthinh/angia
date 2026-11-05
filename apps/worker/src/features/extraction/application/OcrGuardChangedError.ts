/** Đồng thuận/trạng thái/ảnh duyệt có thể đổi trong khi worker tải ảnh. */
export class OcrGuardChangedError extends Error {
  constructor(readonly reason: 'consent_required' | 'privacy_required' | 'skipped') {
    super(reason);
    this.name = 'OcrGuardChangedError';
  }
}
