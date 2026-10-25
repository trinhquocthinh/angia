export interface ImageSize {
  width: number;
  height: number;
}

// Thu ảnh để cạnh dài không vượt `maxEdge`, giữ tỉ lệ; ảnh nhỏ hơn giữ nguyên (không phóng to).
export function fitWithin(size: ImageSize, maxEdge: number): ImageSize {
  const scale = Math.min(1, maxEdge / Math.max(size.width, size.height));
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}
