// Lỗi ảnh cố định để chuyển nhập tay, không mang nội dung ảnh hoặc lỗi decoder vào log.
export class ImageConversionError extends Error {
  constructor() {
    super('image_unusable');
    this.name = 'ImageConversionError';
  }
}
