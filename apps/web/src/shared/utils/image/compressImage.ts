import { fitWithin, type ImageSize } from './fitWithin';

export interface DecodedImage extends ImageSize {
  release(): void;
}
export interface ImageCodec {
  decode(file: Blob): Promise<DecodedImage>;
  encodeJpeg(image: DecodedImage, size: ImageSize, quality: number): Promise<Blob>;
}

// E3-S1-T2 (chủ dự án chốt 2026-10-08): chỉ nén ảnh > 3 MB; HEIC luôn thử đổi sang JPEG vì
// Chrome/Firefox không hiển thị được. Cạnh dài 3000 px vẫn đủ nét để AI đọc chữ đơn thuốc.
const TARGET_BYTES = 3 * 1024 * 1024;
const ATTEMPTS: ReadonlyArray<{ maxEdge: number; quality: number }> = [
  { maxEdge: 3000, quality: 0.85 },
  { maxEdge: 3000, quality: 0.75 },
  { maxEdge: 3000, quality: 0.6 },
  { maxEdge: 2400, quality: 0.6 },
  { maxEdge: 1920, quality: 0.6 },
];
const HEIC = /\.(heic|heif)$/i;

const isHeic = (file: File) =>
  file.type === 'image/heic' || file.type === 'image/heif' || HEIC.test(file.name);
const jpegName = (name: string) => `${name.replace(/\.[^./]+$/, '')}.jpg`;

async function encodeUnderTarget(codec: ImageCodec, image: DecodedImage): Promise<Blob> {
  let blob: Blob | null = null;
  for (const { maxEdge, quality } of ATTEMPTS) {
    blob = await codec.encodeJpeg(image, fitWithin(image, maxEdge), quality);
    if (blob.size <= TARGET_BYTES) break;
  }
  return blob!;
}

// Trả tệp JPEG đã nén, hoặc chính tệp gốc khi không cần nén / trình duyệt không xử lý được
// (máy chủ vẫn kiểm định dạng và trần 10 MiB). Mã hóa lại qua canvas cũng bỏ EXIF (kể cả GPS).
export async function compressImage(file: File, codec: ImageCodec): Promise<File> {
  if (file.size <= TARGET_BYTES && !isHeic(file)) return file;
  let image: DecodedImage;
  try {
    image = await codec.decode(file);
  } catch {
    return file;
  }
  try {
    const blob = await encodeUnderTarget(codec, image);
    return new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    image.release();
  }
}
