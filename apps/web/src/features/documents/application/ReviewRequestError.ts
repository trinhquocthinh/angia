// Lỗi API khi duyệt; `fields` chỉ có với ERR_OUT_OF_RANGE_UNCONFIRMED để đánh dấu đúng ô.
export class ReviewRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fields: string[] = [],
  ) {
    super(message);
    this.name = 'ReviewRequestError';
  }
}
