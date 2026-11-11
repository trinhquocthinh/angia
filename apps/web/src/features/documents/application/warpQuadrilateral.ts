import { quadHomography } from './quadHomography';
import { scanTargetSize } from './scanTargetSize';
import type { Quad, RgbaImage } from './scanTypes';

// Lấy mẫu song tuyến tại toạ độ tâm điểm ảnh (x, y); ngoài ảnh nguồn quá nửa điểm ảnh → trắng.
function sample(source: RgbaImage, x: number, y: number, out: Uint8ClampedArray, at: number) {
  const { width, height, data } = source;
  if (x < -0.5 || y < -0.5 || x > width - 0.5 || y > height - 0.5) {
    out.fill(255, at, at + 4);
    return;
  }
  const cx = Math.min(Math.max(x, 0), width - 1);
  const cy = Math.min(Math.max(y, 0), height - 1);
  const x0 = Math.floor(cx);
  const y0 = Math.floor(cy);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = cx - x0;
  const fy = cy - y0;
  for (let c = 0; c < 4; c += 1) {
    const top = data[(y0 * width + x0) * 4 + c]! * (1 - fx) + data[(y0 * width + x1) * 4 + c]! * fx;
    const bottom = data[(y1 * width + x0) * 4 + c]! * (1 - fx) + data[(y1 * width + x1) * 4 + c]! * fx;
    out[at + c] = top * (1 - fy) + bottom * fy;
  }
}

/** SPEC-084: nắn tứ giác `quad` của ảnh nguồn thành hình chữ nhật (cạnh dài ≤ 3000, không phóng to). */
export function warpQuadrilateral(source: RgbaImage, quad: Quad, maxSide?: number): RgbaImage {
  const { width, height } = scanTargetSize(quad, maxSide);
  const map = quadHomography(quad);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let j = 0; j < height; j += 1) {
    for (let i = 0; i < width; i += 1) {
      const point = map((i + 0.5) / width, (j + 0.5) / height);
      sample(source, point.x - 0.5, point.y - 0.5, data, (j * width + i) * 4);
    }
  }
  return { width, height, data };
}
