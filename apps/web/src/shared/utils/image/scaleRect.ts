import type { PixelRect } from '@src/features/documents/application/redactionPorts';

// Đổi vùng trên ảnh đã xoay sang khung ảnh xuất (trừ gốc cắt, nhân scale), làm tròn ra ngoài để
// vùng che sau khi thu nhỏ vẫn phủ kín ô ban đầu.
export function scaleRect(rect: PixelRect, crop: PixelRect, scale: number): PixelRect {
  const left = Math.floor((rect.left - crop.left) * scale);
  const top = Math.floor((rect.top - crop.top) * scale);
  const right = Math.ceil((rect.left + rect.width - crop.left) * scale);
  const bottom = Math.ceil((rect.top + rect.height - crop.top) * scale);
  return { left, top, width: right - left, height: bottom - top };
}
