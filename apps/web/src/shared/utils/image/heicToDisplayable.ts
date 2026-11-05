import { isHeicFile } from './isHeicFile';

// Bản JPEG để hiện trong trình che khi trình duyệt không hiển thị HEIC; WASM chỉ nạp khi cần.
export async function heicToDisplayable(file: File): Promise<Blob | null> {
  if (!isHeicFile(file)) return null;
  const { heicTo } = await import('heic-to');
  return heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 });
}
