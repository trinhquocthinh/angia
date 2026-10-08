// status 0 = lỗi mạng/không nhận được phản hồi. `retryAfterSeconds` lấy từ header Retry-After (503 bận).
export class DocumentUploadError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(code ?? `HTTP ${status}`);
    this.name = 'DocumentUploadError';
  }
}
