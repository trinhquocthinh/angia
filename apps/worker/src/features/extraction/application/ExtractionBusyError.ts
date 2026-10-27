/** Lỗi có thể thử lại: worker khác đang giữ khóa chứng từ. */
export class ExtractionBusyError extends Error {
  constructor() {
    super('extraction_busy');
    this.name = 'ExtractionBusyError';
  }
}
