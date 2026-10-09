// Lỗi API khi duyệt; `fields` chỉ có với ERR_OUT_OF_RANGE_UNCONFIRMED để đánh dấu đúng ô,
// `invalidItemIndexes` chỉ có với ERR_DOSE_INFO_MISSING để báo đúng dòng thuốc (từ 0).
export class ReviewRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fields: string[] = [],
    public readonly invalidItemIndexes: number[] = [],
  ) {
    super(message);
    this.name = 'ReviewRequestError';
  }
}
