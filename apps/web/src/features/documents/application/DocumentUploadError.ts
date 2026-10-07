// status 0 = lỗi mạng/không nhận được phản hồi.
export class DocumentUploadError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(code ?? `HTTP ${status}`);
    this.name = 'DocumentUploadError';
  }
}
