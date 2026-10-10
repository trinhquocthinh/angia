/** SPEC-012: bản đã lưu bị trùng; `duplicateOf = null` khi bản đó nhập trực tiếp không kèm chứng từ. */
export interface DuplicateRecord {
  duplicateOf: string | null;
  recordDate: string;
  facility: string | null;
  savedAt: string;
}

// Lỗi API khi duyệt; `fields` chỉ có với ERR_OUT_OF_RANGE_UNCONFIRMED để đánh dấu đúng ô,
// `invalidItemIndexes` chỉ có với ERR_DOSE_INFO_MISSING để báo đúng dòng thuốc (từ 0),
// `duplicate` chỉ có với ERR_DUPLICATE_UNCONFIRMED để nêu bản đã lưu.
export class ReviewRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fields: string[] = [],
    public readonly invalidItemIndexes: number[] = [],
    public readonly duplicate: DuplicateRecord | null = null,
  ) {
    super(message);
    this.name = 'ReviewRequestError';
  }
}
