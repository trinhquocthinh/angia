import type {
  DecodedImage,
  RedactionCodec,
  RedactionPlan,
  RenderedImage,
} from '@src/features/documents/application/redactionPorts';
import { decodeHeic } from './decodeHeic';
import { isHeicFile } from './isHeicFile';
import { scaleRect } from './scaleRect';

interface BitmapImage extends DecodedImage {
  bitmap: ImageBitmap;
}
interface CanvasImage extends RenderedImage {
  canvas: HTMLCanvasElement;
}

// Safari tự giải mã HEIC; chỉ trình duyệt không đọc được (Chrome/Firefox) mới phải nạp WASM.
async function toBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (error) {
    if (isHeicFile(file)) return decodeHeic(file);
    throw error;
  }
}

// Cắt + thu nhỏ bằng phép biến đổi lúc vẽ thay vì vẽ ảnh gốc rồi cắt: canvas không bao giờ lớn
// hơn ảnh xuất (≤ 13.000.000 pixel), tránh vượt trần canvas Safari iOS. Vùng che vẽ sau ảnh.
function draw(
  context: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  plan: RedactionPlan,
  output: RenderedImage,
) {
  const { crop, scale } = plan;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, output.width, output.height);
  context.setTransform(scale, 0, 0, scale, -crop.left * scale, -crop.top * scale);
  context.translate(plan.rotated.width / 2, plan.rotated.height / 2);
  context.rotate((plan.rotation * Math.PI) / 180);
  context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = '#000000';
  for (const mask of plan.masks) {
    const rect = scaleRect(mask, crop, scale);
    context.fillRect(rect.left, rect.top, rect.width, rect.height);
  }
}

export function createBrowserRedactionCodec(): RedactionCodec {
  return {
    decode: async (file) => {
      const bitmap = await toBitmap(file);
      const image: BitmapImage = {
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
      return image;
    },
    render: async (image, plan) => {
      const width = Math.max(1, Math.floor(plan.crop.width * plan.scale));
      const height = Math.max(1, Math.floor(plan.crop.height * plan.scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D không khả dụng');
      draw(context, (image as BitmapImage).bitmap, plan, { width, height });
      const rendered: CanvasImage = { width, height, canvas };
      return rendered;
    },
    encodeJpeg: (rendered, quality) =>
      new Promise<Blob>((resolve, reject) => {
        (rendered as CanvasImage).canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Không mã hóa được JPEG'))),
          'image/jpeg',
          quality,
        );
      }),
    // Giải phóng bộ nhớ canvas ngay (Safari iOS giới hạn tổng dung lượng canvas).
    dispose: (rendered) => {
      const { canvas } = rendered as CanvasImage;
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
