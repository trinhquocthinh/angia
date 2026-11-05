// WASM HEIC nặng vài MB: chỉ nạp khi thật sự gặp ảnh HEIC trình duyệt không tự giải mã được.
export async function decodeHeic(file: File): Promise<ImageBitmap> {
  const { heicTo } = await import('heic-to');
  return heicTo({ blob: file, type: 'bitmap' });
}
