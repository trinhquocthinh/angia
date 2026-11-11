import type { RgbaImage } from './scanTypes';

// Ước lượng nền trên ảnh thu nhỏ 1/8: rẻ với ảnh 12 MP và đủ mịn cho bóng đổ (SPEC-084).
const BLOCK = 8;

type Plane = { width: number; height: number; values: Float32Array };

function downscale(image: RgbaImage, channel: number): Plane {
  const width = Math.ceil(image.width / BLOCK);
  const height = Math.ceil(image.height / BLOCK);
  const sums = new Float32Array(width * height);
  const counts = new Uint16Array(width * height);
  for (let y = 0; y < image.height; y += 1) {
    const row = Math.floor(y / BLOCK) * width;
    for (let x = 0; x < image.width; x += 1) {
      const cell = row + Math.floor(x / BLOCK);
      sums[cell] = sums[cell]! + image.data[(y * image.width + x) * 4 + channel]!;
      counts[cell] = counts[cell]! + 1;
    }
  }
  return { width, height, values: sums.map((sum, i) => sum / counts[i]!) };
}

// Max 3×3 xoá nét chữ mảnh: nền là phần sáng nhất quanh mỗi ô.
function dilate({ width, height, values }: Plane): Plane {
  const out = new Float32Array(values.length);
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      let max = 0;
      for (let dy = -1; dy <= 1; dy += 1)
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          max = Math.max(max, values[ny * width + nx]!);
        }
      out[y * width + x] = max;
    }
  return { width, height, values: out };
}

// Làm mờ hộp một chiều (bước `stride`, `count` phần tử mỗi dải), kẹp ở mép.
function blurLine(
  values: Float32Array,
  out: Float32Array,
  start: number,
  stride: number,
  count: number,
  radius: number,
) {
  for (let i = 0; i < count; i += 1) {
    let sum = 0;
    for (let k = -radius; k <= radius; k += 1)
      sum += values[start + Math.min(count - 1, Math.max(0, i + k)) * stride]!;
    out[start + i * stride] = sum / (2 * radius + 1);
  }
}

function blur(plane: Plane): Plane {
  const { width, height } = plane;
  const radius = Math.max(1, Math.round(Math.min(width, height) / 40));
  const rows = new Float32Array(plane.values.length);
  for (let y = 0; y < height; y += 1) blurLine(plane.values, rows, y * width, 1, width, radius);
  const out = new Float32Array(plane.values.length);
  for (let x = 0; x < width; x += 1) blurLine(rows, out, x, width, height, radius);
  return { width, height, values: out };
}

// Nội suy song tuyến giá trị nền tại toạ độ ảnh gốc (x, y).
function backgroundAt({ width, height, values }: Plane, x: number, y: number): number {
  const sx = Math.min(width - 1, Math.max(0, (x + 0.5) / BLOCK - 0.5));
  const sy = Math.min(height - 1, Math.max(0, (y + 0.5) / BLOCK - 0.5));
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const fx = sx - x0;
  const fy = sy - y0;
  const top = values[y0 * width + x0]! * (1 - fx) + values[y0 * width + x1]! * fx;
  const bottom = values[y1 * width + x0]! * (1 - fx) + values[y1 * width + x1]! * fx;
  return top * (1 - fy) + bottom * fy;
}

/** SPEC-084: chia từng kênh màu cho nền ước lượng — giấy và bóng đổ thành trắng, mực giữ màu. Alpha giữ nguyên. */
export function flattenBackground(image: RgbaImage): RgbaImage {
  const planes = [0, 1, 2].map((channel) => blur(dilate(downscale(image, channel))));
  const data = new Uint8ClampedArray(image.data);
  for (let y = 0; y < image.height; y += 1)
    for (let x = 0; x < image.width; x += 1) {
      const at = (y * image.width + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        const background = Math.max(1, backgroundAt(planes[c]!, x, y));
        data[at + c] = Math.min(255, (image.data[at + c]! * 255) / background);
      }
    }
  return { width: image.width, height: image.height, data };
}
