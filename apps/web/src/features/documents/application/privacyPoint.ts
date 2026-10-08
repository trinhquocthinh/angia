export type PrivacyPoint = { x: number; y: number };
type ImageBox = { left: number; top: number; width: number; height: number };
const scale = 1_000_000;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
// Hộp đo là ảnh đã xoay, không phải khung có khoảng trắng quanh ảnh.
export function privacyPoint(x: number, y: number, box: ImageBox): PrivacyPoint {
  return {
    x: Math.round(clamp((x - box.left) / box.width, 0, 1) * scale),
    y: Math.round(clamp((y - box.top) / box.height, 0, 1) * scale),
  };
}
