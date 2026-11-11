import type { UploadItem } from './uploadQueue';

/** SPEC-084: ảnh nắn (nếu có) thay ảnh gốc cho trình che, bản xuất JPEG và gợi ý vùng che (SPEC-083). */
export function redactionSource(item: UploadItem): { file: File; url: string | null } {
  return item.scan ? { file: item.scan.file, url: item.scan.url } : { file: item.file, url: item.previewUrl };
}
