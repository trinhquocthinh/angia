import type { DecodedImage, ImageCodec } from './compressImage';

interface BitmapImage extends DecodedImage {
  bitmap: ImageBitmap;
}

// createImageBitmap xoay theo EXIF (`from-image`); trình duyệt không đọc được định dạng (HEIC trên
// Chrome) thì reject để compressImage gửi tệp gốc. Nền trắng để PNG trong suốt không thành nền đen.
export function createBrowserImageCodec(): ImageCodec {
  return {
    decode: async (file) => {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const image: BitmapImage = {
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
      return image;
    },
    encodeJpeg: (image, size, quality) =>
      new Promise<Blob>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Canvas 2D không khả dụng'));
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size.width, size.height);
        context.drawImage((image as BitmapImage).bitmap, 0, 0, size.width, size.height);
        canvas.toBlob(
          (blob) => {
            // Giải phóng bộ nhớ canvas ngay (Safari iOS giới hạn tổng dung lượng canvas).
            canvas.width = 0;
            canvas.height = 0;
            if (blob) resolve(blob);
            else reject(new Error('Không mã hóa được JPEG'));
          },
          'image/jpeg',
          quality,
        );
      }),
  };
}
